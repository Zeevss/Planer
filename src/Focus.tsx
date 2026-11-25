import { useEffect, useState } from "react";
import { Timer as TimerIcon, Play, Pause, Square, Coffee } from "lucide-react";
import {
  elapsed,
  pauseTimer,
  limit,
  endTimer,
  idle,
  type Book,
  type Mode,
} from "./model";
import type { Update } from "./shared";

export function Focus({
  book,
  day,
  update,
  onSession,
}: {
  book: Book;
  day: string;
  update: Update;
  onSession: (id: string) => void;
}) {
  const t = book.timer,
    [now, setNow] = useState(Date.now);
  useEffect(() => {
    if (!t.started) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [t.started]);
  const ms = elapsed(t, now),
    seconds = Math.max(
      0,
      t.mode === "watch"
        ? Math.floor(ms / 1000)
        : Math.ceil((limit(t.mode) - ms) / 1000),
    ),
    target = book.tasks.find((x) => x.id === t.task);
  const digits =
    String(Math.floor(seconds / 60)).padStart(2, "0") +
    ":" +
    String(seconds % 60).padStart(2, "0");
  async function finish(auto = false) {
    let session = "";
    const ok = await update((b) => {
      if (
        !b.timer.active ||
        (auto &&
          (!b.timer.started ||
            elapsed(b.timer, Date.now()) < limit(b.timer.mode)))
      )
        return;
      const m = b.timer.mode;
      endTimer(b);
      if (m !== "break") session = b.sessions.at(-1)!.id;
      if (auto && m === "pom") b.timer.mode = "break";
    });
    if (ok && session) onSession(session);
  }
  useEffect(() => {
    if (t.started && ms === limit(t.mode)) void finish(true);
  }, [t.started, ms, t.mode]);
  useEffect(() => {
    document.title = t.active
      ? digits + " · " + (target?.title || "Листок")
      : "Листок — личный ежедневник";
  }, [digits, t.active, target?.title]);
  async function toggle() {
    await update((b) => {
      if (b.timer.started) {
        pauseTimer(b.timer);
      } else {
        b.timer.active = true;
        b.timer.started = Date.now();
      }
    });
    setNow(Date.now());
  }
  const change = (m: Mode) =>
    update((b) => {
      if (!b.timer.active) b.timer = idle(m, b.timer.task);
    });
  return (
    <section className="focus paper">
      <header className="section-head">
        <h2>
          <TimerIcon size={21} />
          Фокус
        </h2>
        <span
          className={"status-dot " + (t.active ? "live" : "")}
          title={t.active ? "Сессия открыта" : "Готов к старту"}
        />
      </header>
      <div className="focus-body">
        <div className="segmented">
          {(["pom", "watch"] as Mode[]).map((m) => (
            <button
              key={m}
              disabled={t.active}
              aria-pressed={m === t.mode}
              onClick={() => void change(m)}
            >
              {m === "pom" ? "Помодоро" : "Секундомер"}
            </button>
          ))}
        </div>
        <div className={"dial " + (t.started ? "ticking" : "")}>
          <svg viewBox="0 0 192 192" aria-hidden="true">
            {Array.from({ length: 60 }, (_, i) => (
              <line
                key={i}
                x1="96"
                x2="96"
                y1="7"
                y2={i % 5 === 0 ? "15" : "11"}
                stroke={
                  i < Math.floor((ms / limit(t.mode)) * 60)
                    ? "#537154"
                    : i % 5 === 0
                      ? "#9b9f8f"
                      : "#d2d0be"
                }
                strokeWidth={i % 5 === 0 ? 2 : 1.2}
                transform={"rotate(" + i * 6 + " 96 96)"}
              />
            ))}
          </svg>
          <div className="dial-text">
            <span className="timer-symbol">
              {t.mode === "break" ? (
                <Coffee size={20} />
              ) : (
                <TimerIcon size={20} />
              )}
            </span>
            <strong role="timer">{digits}</strong>
            <small>
              {t.mode === "break"
                ? "перерыв"
                : t.active
                  ? t.started
                    ? "в фокусе"
                    : "пауза"
                  : t.mode === "watch"
                    ? "свободный фокус"
                    : "минуты фокуса"}
            </small>
          </div>
        </div>
        <select
          className="focus-select"
          disabled={t.active || t.mode === "break"}
          value={target ? t.task : ""}
          aria-label="Задача для фокуса"
          onChange={(e) => {
            const task = e.currentTarget.value;
            void update((b) => {
              if (!b.timer.active) b.timer.task = task;
            });
          }}
        >
          <option value="">Свободный фокус</option>
          {book.tasks
            .filter((s) => !s.done || s.id === t.task)
            .sort((a, b) => Number(b.day === day) - Number(a.day === day))
            .map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
        </select>
        {target?.resume && <p className="resume-note">{target.resume}</p>}
        <div className="timer-actions">
          <button className="primary" onClick={() => void toggle()}>
            {t.started ? (
              <Pause size={15} />
            ) : (
              <Play size={15} fill="currentColor" />
            )}
            {t.started
              ? "Пауза"
              : t.active
                ? "Продолжить"
                : t.mode === "break"
                  ? "Начать перерыв"
                  : "Начать фокус"}
          </button>
          {t.active && (
            <button
              className="secondary"
              title="Завершить сессию"
              aria-label="Завершить сессию"
              onClick={() => void finish()}
            >
              <Square size={15} />
            </button>
          )}
        </div>
        {!t.active && t.mode === "break" && (
          <button className="text-btn" onClick={() => void change("pom")}>
            Пропустить перерыв
          </button>
        )}
      </div>
    </section>
  );
}
