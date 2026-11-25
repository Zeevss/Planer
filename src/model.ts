import { openDB } from "idb";

export const levels = ["Лёгкая", "Средняя", "Сложная"] as const;
export const colors = [
  "#77945b",
  "#ce9066",
  "#9381b3",
  "#7195ac",
  "#bb738a",
  "#c0a24a",
];
export type Cat = { id: string; name: string; color: string };
export type Task = {
  id: string;
  title: string;
  cat: string;
  level: string;
  min: number;
  max: number;
  day: string;
  due: string;
  done: string;
  note: string;
  parent: string;
  resume?: string;
  result?: string;
};
export type Mode = "pom" | "watch" | "break";
export type Timer = {
  mode: Mode;
  task: string;
  started: number;
  held: number;
  byDay?: Record<string, number>;
  active: boolean;
};
export type Session = {
  id: string;
  day: string;
  title: string;
  task: string;
  ms: number;
  note: string;
};
export type Journal = { text: string; next: string; plan: string[] };
export type Book = {
  version: 1;
  tasks: Task[];
  cats: Cat[];
  sessions: Session[];
  journal: Record<string, Journal>;
  budgets: Record<string, number>;
  timer: Timer;
};
export const uid = () => crypto.randomUUID();
export const dayKey = (d = new Date()) =>
  [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
export const dateOf = (d: string) => new Date(d + "T12:00:00");
export function shift(d: string, n: number) {
  const t = dateOf(d);
  t.setDate(t.getDate() + n);
  return dayKey(t);
}
export const monday = (d: string) => shift(d, -(dateOf(d).getDay() + 6) % 7);
export const fmt = (d: string, opts: Intl.DateTimeFormatOptions) =>
  dateOf(d).toLocaleDateString("ru-RU", opts);
export const shortDate = (d: string) =>
  fmt(d, { day: "numeric", month: "short" });
export const duration = (m: number) =>
  m >= 60
    ? Math.floor(m / 60) + " ч" + (m % 60 ? " " + (m % 60) + " мин" : "")
    : m + " мин";
export const estimate = (a: number, b: number) =>
  a === b
    ? duration(a)
    : b < 60
      ? a + "–" + b + " мин"
      : duration(a) + " – " + duration(b);
export const focusDuration = (ms: number) =>
  ms > 0 && ms < 60000
    ? Math.max(1, Math.floor(ms / 1000)) + " сек"
    : duration(Math.floor(ms / 60000));
export const emptyJournal = (): Journal => ({ text: "", next: "", plan: [] });
export const idle = (mode: Mode, task = ""): Timer => ({
  mode,
  task,
  started: 0,
  held: 0,
  active: false,
});
export const limit = (m: Mode) =>
  m === "pom" ? 1500000 : m === "break" ? 300000 : Infinity;
export const elapsed = (t: Timer, now: number) =>
  Math.min(
    limit(t.mode),
    t.held + (t.started ? Math.max(0, now - t.started) : 0),
  );
export const newTask = (day = ""): Task => ({
  id: uid(),
  title: "",
  cat: "",
  level: "",
  min: 0,
  max: 0,
  day,
  due: "",
  done: "",
  note: "",
  parent: "",
});
export const defaultBook = (): Book => ({
  version: 1,
  tasks: [],
  cats: ["Учёба", "AD", "Хобби"].map((name, i) => ({
    name,
    id: "cat" + i,
    color: colors[i],
  })),
  sessions: [],
  journal: {},
  budgets: {},
  timer: idle("pom"),
});
// Accumulate actual running time at each pause, split at local midnight.
export function pauseTimer(t: Timer, now = Date.now()) {
  if (!t.started) return;
  const amount = elapsed(t, now) - t.held;
  const end = t.started + amount;
  let cursor = t.started;
  t.byDay ??= {};
  while (cursor < end) {
    const midnight = new Date(cursor);
    midnight.setHours(24, 0, 0, 0);
    const stop = Math.min(end, midnight.getTime());
    const day = dayKey(new Date(cursor));
    t.byDay[day] = (t.byDay[day] || 0) + stop - cursor;
    cursor = stop;
  }
  t.held += amount;
  t.started = 0;
}
export function endTimer(b: Book, now = Date.now()) {
  const t = b.timer;
  if (!t.active) return;
  pauseTimer(t, now);
  if (t.mode !== "break") {
    const days = t.byDay ?? {};
    const accounted = Object.values(days).reduce((sum, n) => sum + n, 0);
    // Copies saved by earlier versions contain a single paused duration.
    if (accounted < t.held || !Object.keys(days).length) {
      const day = dayKey(new Date(now));
      days[day] = (days[day] || 0) + Math.max(0, t.held - accounted);
    }
    const title =
      b.tasks.find((task) => task.id === t.task)?.title || "Свободный фокус";
    for (const [day, ms] of Object.entries(days).sort(([a], [b]) =>
      a.localeCompare(b),
    )) {
      b.sessions.push({ id: uid(), task: t.task, title, day, ms, note: "" });
    }
  }
  b.timer = idle(t.mode === "break" ? "pom" : t.mode, t.task);
}
export function moveTask(b: Book, id: string, day: string, before = "") {
  const i = b.tasks.findIndex((x) => x.id === id);
  if (i < 0 || before === id || (day && b.tasks.some((t) => t.parent === id)))
    return;
  const [t] = b.tasks.splice(i, 1);
  if (t.day && t.day !== day && t.day <= dayKey()) {
    const journal = (b.journal[t.day] ??= emptyJournal());
    if (!journal.plan.includes(t.title)) journal.plan.push(t.title);
  }
  t.day = day;
  const j = b.tasks.findIndex((x) => x.id === before);
  b.tasks.splice(j < 0 ? b.tasks.length : j, 0, t);
}
const db = openDB("listok-notebook", 1, {
  upgrade(db) {
    db.createObjectStore("book");
  },
});
export async function readBook(): Promise<Book> {
  return (await (await db).get("book", "main")) ?? defaultBook();
}
export const changes = new BroadcastChannel("listok-updates");
export async function editBook(change: (b: Book) => void) {
  const tx = (await db).transaction("book", "readwrite");
  const b: Book = (await tx.store.get("main")) ?? defaultBook();
  change(b);
  await tx.store.put(b, "main");
  await tx.done;
  changes.postMessage("refresh");
  return b;
}
