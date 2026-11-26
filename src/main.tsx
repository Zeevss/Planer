import { PaperSelect, categoryOptions, levelOptions } from "./PaperSelect";
import { useCallback, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Sun,
  CalendarDays,
  Layers3,
  History,
  Plus,
  ChevronRight,
  ChevronLeft,
  BookOpen,
  Database,
  Menu,
  Feather,
  ArrowUpRight,
  Search,
  CalendarCheck,
} from "lucide-react";
import { Art } from "./Art";
import { Backup } from "./Backup";
import { Categories, TaskForm, Reflection, NoteForm } from "./Forms";
import { Focus } from "./Focus";
import { TaskList } from "./Tasks";
import { Week } from "./Week";
import { Modal, IconButton, type Update } from "./shared";
import {
  readBook,
  editBook,
  changes,
  dayKey,
  shift,
  fmt,
  newTask,
  monday,
  endTimer,
  idle,
  shortDate,
  focusDuration,
  type Book,
  type Task,
} from "./model";
import "@fontsource-variable/golos-text";
import "@fontsource-variable/caveat";
import "./style.css";

type View = "day" | "week" | "all" | "history";
const pages = [
  { id: "day", label: "Сегодня", icon: Sun },
  { id: "week", label: "Неделя", icon: CalendarDays },
  { id: "all", label: "Все задачи", icon: Layers3 },
  { id: "history", label: "История", icon: History },
] as const;
type Dialog =
  | { kind: "task"; task: Task }
  | { kind: "note"; id: string; session: boolean }
  | { kind: "journal"; day: string }
  | { kind: "cats" | "backup" | "budget" };
function App() {
  const [book, setBook] = useState<Book | null>(null),
    [error, setError] = useState(""),
    [today, setToday] = useState(dayKey()),
    [day, setDay] = useState(today),
    [view, setView] = useState<View>("day"),
    [dialog, setDialog] = useState<Dialog | null>(null);
  const [cat, setCat] = useState(""),
    [level, setLevel] = useState(""),
    [query, setQuery] = useState(""),
    [dates, setDates] = useState(""),
    [mobile, setMobile] = useState(false);
  const [pendingSession, setPendingSession] = useState("");
  useEffect(() => {
    if (!dialog && pendingSession) {
      setDialog({ kind: "note", id: pendingSession, session: true });
      setPendingSession("");
    }
  }, [dialog, pendingSession]);
  const refresh = useCallback(async () => {
    try {
      setBook(await readBook());
    } catch {
      setError(
        "Не удалось открыть данные браузера. Проверь доступ к хранилищу сайта и перезагрузи страницу.",
      );
    }
  }, []);
  useEffect(() => {
    void refresh();
    changes.addEventListener("message", refresh);
    return () => changes.removeEventListener("message", refresh);
  }, [refresh]);
  useEffect(() => {
    const h = setInterval(() => {
      const now = dayKey();
      if (now !== today) {
        setToday(now);
        setDay((prev) => (prev === today ? now : prev));
      }
    }, 5000);
    return () => clearInterval(h);
  }, [today]);
  const update: Update = useCallback(async (fn) => {
    try {
      setBook(await editBook(fn));
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось сохранить данные");
      return false;
    }
  }, []);
  function go(v: View) {
    setView(v);
    setMobile(false);
    setCat("");
    setQuery("");
    setLevel("");
    setDates("");
    if (v === "day") setDay(dayKey());
  }
  function openDay(d: string) {
    setDay(d);
    setView("day");
  }
  function add(d: string) {
    setDialog({ kind: "task", task: { ...newTask(d), cat } });
  }
  function edit(t: Task) {
    setDialog({ kind: "task", task: t });
  }
  function note(id: string, session = false) {
    setDialog({ kind: "note", id, session });
  }
  async function check(t: Task) {
    const ok = await update((b) => {
      const x = b.tasks.find((a) => a.id === t.id);
      if (!x) return;
      x.done = x.done ? "" : dayKey();
      if (x.done && b.timer.task === t.id) {
        if (b.timer.active) endTimer(b);
        b.timer.task = "";
      }
    });
    if (ok && !t.done) note(t.id);
  }
  async function start(t: Task) {
    await update((b) => {
      if (b.timer.active) return;
      b.timer = {
        ...idle(b.timer.mode === "break" ? "pom" : b.timer.mode, t.id),
        started: Date.now(),
        active: true,
      };
    });
  }
  if (!book)
    return <main className="loading">{error || "Открываем ежедневник…"}</main>;
  const weekStart = monday(day),
    page = pages.find((p) => p.id === view)!,
    category = book.cats.find((c) => c.id === cat);
  const dayTasks = book.tasks.filter((t) => t.day === day),
    completed = dayTasks.filter((t) => t.done).length;
  const matches = book.tasks.filter(
    (t) =>
      (!cat || t.cat === cat) &&
      (!level || t.level === level) &&
      (!dates || (dates === "none" ? !t.day : !!t.day)) &&
      t.title.toLocaleLowerCase().includes(query.toLocaleLowerCase()),
  );
  const historyDays = Array.from(
    new Set([
      ...Object.keys(book.journal),
      ...book.sessions.map((s) => s.day),
      ...book.tasks
        .flatMap((t) => [t.done, t.day && t.day < today ? t.day : ""])
        .filter(Boolean),
    ]),
  )
    .sort()
    .reverse();
  const label =
    view === "day" && day !== today ? "День" : category?.name || page.label;
  return (
    <div className="shell">
      {mobile && (
        <button
          className="scrim"
          aria-label="Закрыть меню"
          onClick={() => setMobile(false)}
        />
      )}
      <aside className={"sidebar " + (mobile ? "opened" : "")}>
        <button className="brand" onClick={() => go("day")}>
          <img src="/leaf.svg" alt="" />
          <span>Листок</span>
        </button>
        <nav aria-label="Разделы">
          {pages.map((p) => (
            <button
              key={p.id}
              className={view === p.id && !cat ? "selected" : ""}
              onClick={() => go(p.id)}
            >
              <p.icon size={19} />
              {p.label}
              {p.id === "day" && <span className="nav-pin" />}
            </button>
          ))}
        </nav>
        <div className="cat-heading">
          <span>Категории</span>
          <IconButton
            name="Новая категория"
            onClick={() => setDialog({ kind: "cats" })}
          >
            <Plus size={16} />
          </IconButton>
        </div>
        <div className="cat-list">
          {book.cats.map((c) => (
            <button
              className={c.id === cat ? "selected" : ""}
              key={c.id}
              onClick={() => {
                go("all");
                setCat(c.id);
              }}
            >
              <i style={{ background: c.color }} />
              {c.name}
            </button>
          ))}
        </div>
        <div className="side-bottom">
          <Art kind="sprig" />
          <button onClick={() => setDialog({ kind: "backup" })}>
            <Database size={17} />
            Данные ежедневника
          </button>
        </div>
      </aside>
      <main className="desk">
        <div className="topline">
          <div>
            <button
              className="mobile-menu icon-btn"
              aria-label="Меню"
              onClick={() => setMobile(true)}
            >
              <Menu />
            </button>
            <BookOpen size={16} />
            <span>Мой ежедневник</span>
            <ChevronRight size={13} />
            <b>{label}</b>
          </div>
          <span className="local">
            <i />
            Локально
          </span>
        </div>
        <header className="hero">
          <div className="hero-copy">
            <h1>
              {view === "day" ? "Мой день" : category?.name || page.label}
            </h1>
            <p>
              {view === "day"
                ? fmt(day, { weekday: "long", day: "numeric", month: "long" })
                : view === "week"
                  ? shortDate(weekStart) +
                    " — " +
                    shortDate(shift(weekStart, 6))
                  : view === "all"
                    ? "Дела и планы"
                    : "Страницы ежедневника"}
            </p>
          </div>
          <Art kind="land" />
        </header>
        {error && (
          <div role="alert" className="error">
            {error}
            <button onClick={() => setError("")}>Закрыть</button>
          </div>
        )}
        <div className={view === "day" ? "columns" : "workspace"}>
          <div className="primary-column">
            {view === "day" && (
              <>
                <section className="weekstrip" aria-label="Выбор дня">
                  <IconButton
                    name="На неделю назад"
                    onClick={() => setDay(shift(day, -7))}
                  >
                    <ChevronLeft />
                  </IconButton>
                  {Array.from({ length: 7 }, (_, i) => {
                    const d = shift(weekStart, i);
                    return (
                      <button
                        key={d}
                        className={
                          "date-cell " +
                          (d === day ? "picked " : "") +
                          (d === today ? "today" : "")
                        }
                        aria-label={fmt(d, { day: "numeric", month: "long" })}
                        aria-pressed={d === day}
                        onClick={() => setDay(d)}
                      >
                        <small>{fmt(d, { weekday: "short" })}</small>
                        <strong>{Number(d.slice(-2))}</strong>
                        <i
                          className={
                            book.tasks.some((t) => t.day === d) ? "marked" : ""
                          }
                        />
                      </button>
                    );
                  })}
                  <IconButton
                    name="На неделю вперёд"
                    onClick={() => setDay(shift(day, 7))}
                  >
                    <ChevronRight />
                  </IconButton>
                </section>
                <TaskList
                  book={book}
                  tasks={dayTasks}
                  day={day}
                  onAdd={() => add(day)}
                  edit={edit}
                  check={check}
                  start={start}
                  update={update}
                  budget={() => setDialog({ kind: "budget" })}
                />
                <div className="day-foot">
                  <span>
                    <CalendarCheck size={15} />
                    Выполнено за день
                  </span>
                  <span className="progress">
                    <i
                      style={{
                        width:
                          (dayTasks.length
                            ? (100 * completed) / dayTasks.length
                            : 0) + "%",
                      }}
                    />
                  </span>
                  <b>
                    {completed} из {dayTasks.length}
                  </b>
                </div>
              </>
            )}
            {view === "week" && (
              <Week
                day={day}
                setDay={setDay}
                book={book}
                add={add}
                edit={edit}
                update={update}
                openDay={openDay}
              />
            )}
            {view === "all" && (
              <>
                <div className="filterbar">
                  <label className="search">
                    <Search size={15} />
                    <input
                      aria-label="Поиск задач"
                      placeholder="Найти задачу"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                  </label>
                  <PaperSelect
                    label="Категория"
                    value={cat}
                    onChange={setCat}
                    options={categoryOptions(book.cats, "Все категории")}
                  />
                  <PaperSelect
                    label="Сложность"
                    value={level}
                    onChange={setLevel}
                    options={levelOptions("Любая сложность")}
                  />
                  <PaperSelect
                    label="Планирование"
                    value={dates}
                    onChange={setDates}
                    options={[
                      { value: "", label: "Любая дата" },
                      { value: "none", label: "Без даты" },
                      { value: "set", label: "С датой" },
                    ]}
                  />
                </div>
                <TaskList
                  all
                  book={book}
                  tasks={matches}
                  day={day}
                  onAdd={() => add("")}
                  edit={edit}
                  check={check}
                  start={(t) => {
                    void start(t);
                    openDay(t.day || today);
                  }}
                  update={update}
                />
              </>
            )}
            {view === "history" && (
              <section className="paper history">
                <header className="section-head">
                  <h2>
                    <History size={21} />
                    Дневные записи
                  </h2>
                </header>
                {!historyDays.length && (
                  <div className="empty">
                    <Feather size={32} />
                    <h3>Первая страница впереди</h3>
                    <p>
                      Здесь появятся выполненные дела, сессии фокуса и итоги
                      дня.
                    </p>
                    <button
                      className="secondary"
                      onClick={() => setDialog({ kind: "journal", day: today })}
                    >
                      Подвести итоги
                    </button>
                  </div>
                )}
                {historyDays.map((d) => (
                  <button
                    key={d}
                    className="history-row"
                    onClick={() => setDialog({ kind: "journal", day: d })}
                  >
                    <div>
                      <strong>
                        {fmt(d, {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </strong>
                      <small>
                        Завершено:{" "}
                        {book.tasks.filter((t) => t.done === d).length} · Фокус:{" "}
                        {focusDuration(
                          book.sessions
                            .filter((s) => s.day === d)
                            .reduce((sum, s) => sum + s.ms, 0),
                        )}
                      </small>
                      {book.journal[d]?.text && <p>{book.journal[d].text}</p>}
                    </div>
                    <ChevronRight size={18} />
                  </button>
                ))}
              </section>
            )}
          </div>
          <div className="right-column" hidden={view !== "day"}>
            <Focus
              book={book}
              day={day}
              update={update}
              onSession={setPendingSession}
            />
            <button
              className="reflection"
              onClick={() => setDialog({ kind: "journal", day })}
            >
              <span className="tape" />
              <span className="reflection-top">
                <Feather size={22} />
                <ArrowUpRight size={17} />
              </span>
              <strong>Итоги дня</strong>
              <span>
                {book.journal[day]?.text || book.journal[day]?.next
                  ? "Открыть свою запись"
                  : "Оставить вечернюю заметку"}
              </span>
            </button>
          </div>
        </div>
        {view !== "day" && book.timer.active && (
          <button className="ongoing" onClick={() => openDay(today)}>
            К таймеру фокуса <ChevronRight size={15} />
          </button>
        )}
      </main>
      {dialog?.kind === "task" && (
        <TaskForm
          key={dialog.task.id}
          initial={dialog.task}
          book={book}
          update={update}
          step={edit}
          close={() => setDialog(null)}
        />
      )}
      {dialog?.kind === "cats" && (
        <Categories book={book} update={update} close={() => setDialog(null)} />
      )}
      {dialog?.kind === "journal" && (
        <Reflection
          book={book}
          day={dialog.day}
          update={update}
          close={() => setDialog(null)}
        />
      )}
      {dialog?.kind === "note" && (
        <NoteForm
          book={book}
          id={dialog.id}
          session={dialog.session}
          update={update}
          close={() => setDialog(null)}
        />
      )}
      {dialog?.kind === "backup" && (
        <Backup book={book} update={update} close={() => setDialog(null)} />
      )}
      {dialog?.kind === "budget" && (
        <Modal title="Ориентир нагрузки" onClose={() => setDialog(null)}>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const n = Number(new FormData(e.currentTarget).get("minutes"));
              if (
                await update((b) => {
                  b.budgets[day] = n;
                })
              )
                setDialog(null);
            }}
          >
            <p>
              Сколько времени планируешь выделить {shortDate(day)}? Очередь
              можно пополнять и сверх ориентира.
            </p>
            <label>
              Минут на день
              <input
                type="number"
                name="minutes"
                defaultValue={book.budgets[day] || ""}
                min="1"
                max="1440"
                placeholder="Без ориентира"
              />
            </label>
            <footer>
              <button className="primary">Сохранить</button>
            </footer>
          </form>
        </Modal>
      )}
    </div>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
