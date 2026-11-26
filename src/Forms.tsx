import { PaperSelect, categoryOptions, levelOptions } from "./PaperSelect";
import { useState } from "react";
import { Check, Plus, Trash2, ArrowRight, Clock3 } from "lucide-react";
import { Modal, type Update } from "./shared";
import {
  colors,
  uid,
  newTask,
  shift,
  moveTask,
  shortDate,
  focusDuration,
  emptyJournal,
  type Book,
  type Task,
} from "./model";

export function TaskForm({
  book,
  initial,
  update,
  close,
  step,
}: {
  book: Book;
  initial: Task;
  update: Update;
  close: () => void;
  step: (t: Task) => void;
}) {
  const [t, set] = useState(initial),
    [confirm, setConfirm] = useState(false);
  const exists = book.tasks.some((x) => x.id === t.id),
    children = book.tasks.filter((x) => x.parent === t.id);
  const field = (k: keyof Task, v: string | number) =>
    set((s) => ({ ...s, [k]: v }));
  async function save() {
    if (!t.title.trim()) return false;
    return update((b) => {
      const prev = b.tasks.find((x) => x.id === t.id),
        patch = {
          ...t,
          title: t.title.trim(),
          min: t.min || t.max,
          max: t.max || t.min,
        };
      if (prev) {
        if (prev.day !== t.day) moveTask(b, t.id, t.day);
        Object.assign(prev, patch, { done: prev.done });
      } else {
        if (patch.parent) {
          const parent = b.tasks.find((x) => x.id === patch.parent);
          if (parent) parent.day = "";
        }
        b.tasks.push(patch);
      }
    });
  }
  return (
    <Modal
      title={
        exists ? "Карточка задачи" : t.parent ? "Новый шаг" : "Новая задача"
      }
      onClose={close}
    >
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (await save()) close();
        }}
      >
        <label>
          Название
          <input
            required
            pattern=".*\S.*"
            autoFocus
            maxLength={220}
            placeholder="Что предстоит сделать?"
            value={t.title}
            onChange={(e) => field("title", e.target.value)}
          />
        </label>
        <div className="fields">
          <label>
            Категория
            <PaperSelect
              label="Категория"
              value={t.cat}
              onChange={(v) => field("cat", v)}
              options={categoryOptions(book.cats, "Без категории")}
            />
          </label>
          <label>
            Сложность
            <PaperSelect
              label="Сложность"
              value={t.level}
              onChange={(v) => field("level", v)}
              options={levelOptions("Без оценки")}
            />
          </label>
        </div>
        {t.parent && !exists && (
          <p>
            В плане появится этот шаг. Общая задача останется в разделе «Все
            задачи» со своим дедлайном.
          </p>
        )}
        {children.length > 0 && <p>Дни работы указаны в шагах этой задачи.</p>}
        <div className="fields">
          <label>
            День в плане
            <input
              type="date"
              disabled={children.length > 0}
              value={t.day}
              onChange={(e) => field("day", e.target.value)}
            />
          </label>
          <label>
            Дедлайн
            <input
              type="date"
              value={t.due}
              onChange={(e) => field("due", e.target.value)}
            />
          </label>
        </div>
        <div className="fields">
          <label>
            Оценка от, мин
            <input
              type="number"
              min="1"
              max="100000"
              placeholder="30"
              value={t.min || ""}
              onChange={(e) => field("min", Number(e.target.value))}
            />
          </label>
          <label>
            До, мин
            <input
              type="number"
              min={t.min || 1}
              max="100000"
              placeholder="60"
              value={t.max || ""}
              onChange={(e) => field("max", Number(e.target.value))}
            />
          </label>
        </div>
        <label>
          Заметка
          <textarea
            rows={2}
            value={t.note}
            placeholder="Детали или на чём остановился…"
            onChange={(e) => field("note", e.target.value)}
          />
        </label>
        {t.resume && <p>После фокуса · {t.resume}</p>}
        {t.result && <p>Итог задачи · {t.result}</p>}
        {children.length > 0 && (
          <p>Шаги: {children.map((c) => c.title).join(" · ")}</p>
        )}
        {exists && !t.parent && (
          <button
            className="text-btn"
            type="button"
            onClick={async (e) => {
              if (e.currentTarget.form?.reportValidity() && (await save()))
                step({ ...newTask(t.day), cat: t.cat, parent: t.id });
            }}
          >
            <Plus size={15} />
            Добавить шаг
          </button>
        )}
        <footer>
          {exists && (
            <button
              className="text-btn danger"
              type="button"
              disabled={book.timer.active && book.timer.task === t.id}
              onClick={async () => {
                if (!confirm) {
                  setConfirm(true);
                  return;
                }
                if (
                  await update((b) => {
                    if (b.timer.active && b.timer.task === t.id)
                      throw Error("Сначала заверши фокус");
                    b.tasks = b.tasks.filter((x) => x.id !== t.id);
                    b.tasks.forEach((x) => {
                      if (x.parent === t.id) x.parent = "";
                    });
                  })
                )
                  close();
              }}
            >
              <Trash2 size={15} />
              {confirm ? "Подтвердить удаление" : "Удалить"}
            </button>
          )}
          <button className="primary" type="submit">
            {exists ? "Сохранить" : "Добавить"}
          </button>
        </footer>
      </form>
    </Modal>
  );
}

export function Categories({
  book,
  update,
  close,
}: {
  book: Book;
  update: Update;
  close: () => void;
}) {
  const [name, setName] = useState(""),
    [color, setColor] = useState(colors[0]),
    [err, setErr] = useState("");
  return (
    <Modal title="Новая категория" onClose={close}>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!name.trim()) return;
          if (
            book.cats.some(
              (x) => x.name.toLowerCase() === name.trim().toLowerCase(),
            )
          ) {
            setErr("Такая категория уже есть");
            return;
          }
          if (
            await update((b) => {
              b.cats.push({ id: uid(), name: name.trim(), color });
            })
          )
            close();
        }}
      >
        <label>
          Название
          <input
            autoFocus
            required
            maxLength={40}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setErr("");
            }}
          />
        </label>
        <fieldset>
          <legend>Цвет</legend>
          <div className="swatches">
            {colors.map((c, i) => (
              <button
                type="button"
                aria-label={"Цвет " + (i + 1)}
                aria-pressed={color === c}
                key={c}
                style={{ background: c }}
                onClick={() => setColor(c)}
              >
                {color === c && <Check size={16} />}
              </button>
            ))}
          </div>
        </fieldset>
        {err && <p role="alert">{err}</p>}
        <footer>
          <button className="primary">Добавить категорию</button>
        </footer>
      </form>
    </Modal>
  );
}

export function Reflection({
  book,
  day,
  update,
  close,
}: {
  book: Book;
  day: string;
  update: Update;
  close: () => void;
}) {
  const old = book.journal[day] || emptyJournal(),
    plan = book.tasks.filter((x) => x.day === day),
    done = book.tasks.filter((x) => x.done === day),
    sessions = book.sessions.filter((x) => x.day === day);
  const [text, setText] = useState(old.text),
    [next, setNext] = useState(old.next),
    [moves, setMoves] = useState<Record<string, string>>({}),
    [first, setFirst] = useState("");
  return (
    <Modal title={"Итоги · " + shortDate(day)} onClose={close}>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (
            await update((b) => {
              b.journal[day] = {
                text,
                next,
                plan: [...new Set([...old.plan, ...plan.map((t) => t.title)])],
              };
              for (const [id, d] of Object.entries(moves)) {
                if (d !== day) moveTask(b, id, d);
              }
              if (first && moves[first] === shift(day, 1)) {
                const before = b.tasks.find(
                  (t) => t.id !== first && t.day === moves[first],
                )?.id;
                moveTask(b, first, moves[first], before);
              }
            })
          )
            close();
        }}
      >
        <div className="recap">
          <Check size={16} /> Завершено: {done.length}
          <Clock3 size={16} /> Фокус:{" "}
          {focusDuration(sessions.reduce((sum, s) => sum + s.ms, 0))}
        </div>
        {(plan.length > 0 || old.plan.length > 0) && (
          <details className="plan-snapshot">
            <summary>Что было в плане</summary>
            <ul>
              {[...new Set([...old.plan, ...plan.map((t) => t.title)])].map(
                (title) => (
                  <li key={title}>{title}</li>
                ),
              )}
            </ul>
          </details>
        )}
        {done.map((t) => (
          <p className="summary-row" key={t.id}>
            ✓ {t.title}
            {t.result && " — " + t.result}
          </p>
        ))}
        {sessions.map((s) => (
          <p className="summary-row" key={s.id}>
            {s.title} · {focusDuration(s.ms)}
            {s.note && " — " + s.note}
          </p>
        ))}
        <label>
          Что сегодня помогло или помешало?
          <textarea
            autoFocus
            rows={3}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </label>
        <label>
          С чего начну завтра?
          <textarea
            rows={2}
            value={next}
            onChange={(e) => setNext(e.target.value)}
          />
        </label>
        {plan.some((x) => !x.done) && (
          <fieldset>
            <legend>Незавершённые задачи</legend>
            {plan
              .filter((x) => !x.done)
              .map((t) => (
                <div className="rollover" key={t.id}>
                  <span>{t.title}</span>
                  <PaperSelect
                    label={"Перенос " + t.title}
                    value={moves[t.id] ?? day}
                    onChange={(v) => setMoves({ ...moves, [t.id]: v })}
                    options={[
                      { value: day, label: "Оставить" },
                      { value: shift(day, 1), label: "На завтра" },
                      { value: "", label: "Без даты" },
                      ...(moves[t.id] &&
                      ![day, shift(day, 1)].includes(moves[t.id])
                        ? [
                            {
                              value: moves[t.id],
                              label: shortDate(moves[t.id]),
                            },
                          ]
                        : []),
                    ]}
                  />
                  <input
                    type="date"
                    aria-label="Выбрать день переноса"
                    value={moves[t.id] ?? day}
                    onChange={(e) =>
                      setMoves({ ...moves, [t.id]: e.target.value })
                    }
                  />
                </div>
              ))}
          </fieldset>
        )}
        {Object.values(moves).includes(shift(day, 1)) && (
          <label>
            Первой на завтра
            <PaperSelect
              label="Первой на завтра"
              value={moves[first] === shift(day, 1) ? first : ""}
              onChange={setFirst}
              options={[
                { value: "", label: "Сохранить порядок" },
                ...plan
                  .filter((t) => moves[t.id] === shift(day, 1))
                  .map((t) => ({ value: t.id, label: t.title })),
              ]}
            />
          </label>
        )}
        <footer>
          <button className="primary">
            Сохранить итоги <ArrowRight size={15} />
          </button>
        </footer>
      </form>
    </Modal>
  );
}
export function NoteForm({
  book,
  id,
  session,
  update,
  close,
}: {
  book: Book;
  id: string;
  session?: boolean;
  update: Update;
  close: () => void;
}) {
  const item = session
    ? book.sessions.find((s) => s.id === id)
    : book.tasks.find((t) => t.id === id);
  const [note, setNote] = useState(
    book.tasks.find((t) => !session && t.id === id)?.result || "",
  );
  return (
    <Modal
      title={session ? "Фокус завершён" : "Задача выполнена"}
      onClose={close}
    >
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (
            await update((b) => {
              const s = session
                ? b.sessions.find((x) => x.id === id)
                : undefined;
              const t = b.tasks.find((x) => x.id === (session ? s?.task : id));
              if (s) s.note = note;
              if (t && s) t.resume = note;
              if (t && !session) t.result = note;
            })
          )
            close();
        }}
      >
        <p className="note-title">{item?.title}</p>
        <label>
          {session ? "На чём остановился?" : "Что стоит запомнить?"}
          <textarea
            autoFocus
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </label>
        <footer>
          <button className="text-btn" type="button" onClick={close}>
            Пропустить
          </button>
          <button className="primary">Сохранить заметку</button>
        </footer>
      </form>
    </Modal>
  );
}
