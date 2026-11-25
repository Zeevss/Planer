import { useLayoutEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronDown,
  Clock3,
  GripVertical,
  Play,
  Plus,
  ListTodo,
  Flag,
  SlidersHorizontal,
} from "lucide-react";
import { Art } from "./Art";
import {
  type Book,
  type Task,
  estimate,
  shortDate,
  duration,
  moveTask,
} from "./model";
import { IconButton, type Update } from "./shared";

export function Stats({
  tasks,
  budget = 0,
}: {
  tasks: Task[];
  budget?: number;
}) {
  const min = tasks.reduce((a, t) => a + t.min, 0),
    max = tasks.reduce((a, t) => a + t.max, 0),
    missing = tasks.filter((x) => !x.min).length;
  return (
    <div className="task-stats">
      <Clock3 size={14} />
      <span>
        {min ? estimate(min, max) : missing ? "Время не указано" : "0 мин"}
        {min > 0 && missing > 0 ? " + без оценки: " + missing : ""}
        {budget > 0 ? " / " + duration(budget) : ""}
      </span>
      {budget > 0 && max > budget && (
        <span className="over">
          {min > budget ? "Выше ориентира" : "Возможна перегрузка"}
        </span>
      )}
    </div>
  );
}
type Props = {
  book: Book;
  tasks: Task[];
  day: string;
  all?: boolean;
  onAdd: () => void;
  edit: (t: Task) => void;
  check: (t: Task) => void;
  start: (t: Task) => void;
  update: Update;
  budget?: () => void;
};
export function TaskList({
  book,
  tasks,
  day,
  all = false,
  onAdd,
  edit,
  check,
  start,
  update,
  budget,
}: Props) {
  const [expanded, setExpanded] = useState(true),
    [drag, setDrag] = useState("");
  const pending = tasks.filter((x) => !x.done),
    done = tasks.filter((x) => x.done);
  const list = useRef<HTMLDivElement>(null);
  const positions = useRef(new Map<string, number>());
  const order = pending.map((t) => t.id).join(",");
  useLayoutEffect(() => {
    const next = new Map<string, number>();
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    for (const row of list.current?.querySelectorAll<HTMLElement>(
      "[data-task]",
    ) ?? []) {
      const id = row.dataset.task!;
      const top = row.offsetTop;
      const old = positions.current.get(id);
      if (!reduced && old !== undefined && old !== top) {
        row.animate(
          [
            { transform: "translateY(" + (old - top) + "px)" },
            { transform: "translateY(0)" },
          ],
          { duration: 190, easing: "ease-out" },
        );
      }
      next.set(id, top);
    }
    positions.current = next;
  }, [order]);
  function row(t: Task, i: number) {
    const c = book.cats.find((c) => c.id === t.cat),
      parent = book.tasks.find((p) => p.id === t.parent);
    function nudge(delta: number) {
      const siblings = pending.filter((x) => x.day === t.day),
        j = siblings.findIndex((x) => x.id === t.id);
      if (j + delta < 0 || j + delta >= siblings.length) return;
      void update((b) =>
        moveTask(b, t.id, t.day, siblings[delta > 0 ? j + 2 : j - 1]?.id),
      );
    }
    return (
      <div
        className={
          "task-row " +
          (t.done ? "is-done " : "") +
          (drag === t.id ? "dragged" : "")
        }
        key={t.id}
        data-task={t.id}
        onDragOver={(e) => {
          if (!all) e.preventDefault();
        }}
        onDrop={(e) => {
          e.preventDefault();
          const id = e.dataTransfer.getData("text/plain");
          if (!all && id) void update((b) => moveTask(b, id, day, t.id));
          setDrag("");
        }}
      >
        {!all && !t.done && (
          <span
            className="handle"
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData("text/plain", t.id);
              setDrag(t.id);
            }}
            onDragEnd={() => setDrag("")}
            title="Перетащи для смены порядка"
          >
            <GripVertical size={14} />
          </span>
        )}
        <button
          className="check"
          aria-label={(t.done ? "Открыть снова: " : "Завершить: ") + t.title}
          onClick={() => check(t)}
        >
          {t.done && <Check size={14} />}
        </button>
        <button className="task-detail" onClick={() => edit(t)}>
          <strong>{t.title}</strong>
          <span className="meta">
            {parent && <span>↳ {parent.title}</span>}
            {c && (
              <span className="chip" style={{ background: c.color + "22" }}>
                <i style={{ background: c.color }} />
                {c.name}
              </span>
            )}
            {t.level && <span>{t.level}</span>}
            {t.max > 0 && (
              <span>
                <Clock3 size={12} />
                {estimate(t.min, t.max)}
              </span>
            )}
            {t.due && (
              <span>
                <Flag size={12} />
                {shortDate(t.due)}
              </span>
            )}
            {all && <span>{t.day ? shortDate(t.day) : "Без даты"}</span>}
          </span>
        </button>
        {!all && !t.done && (
          <div className="row-order">
            <IconButton
              name={"Выше: " + t.title}
              disabled={i === 0}
              onClick={() => nudge(-1)}
            >
              <ArrowUp />
            </IconButton>
            <IconButton
              name={"Ниже: " + t.title}
              disabled={i === pending.length - 1}
              onClick={() => nudge(1)}
            >
              <ArrowDown />
            </IconButton>
          </div>
        )}
        {!t.done && (
          <IconButton
            name={"Фокус: " + t.title}
            disabled={book.timer.active}
            onClick={() => start(t)}
          >
            <Play size={15} />
          </IconButton>
        )}
      </div>
    );
  }
  return (
    <section className="paper task-sheet">
      <header className="section-head">
        <h2>
          <ListTodo size={22} />
          {all ? "Список задач" : "План на день"}{" "}
          <span className="count">{pending.length}</span>
        </h2>
        <button className="compact-add" onClick={onAdd}>
          <Plus size={16} />
          Добавить
        </button>
      </header>
      <div className="list-body" ref={list}>
        {pending.map(row)}
        {!pending.length && (
          <div className="empty lined">
            <Art kind="book" />
            <h3>
              {done.length
                ? "Всё сделано"
                : all
                  ? "Задач пока нет"
                  : "Пока чистый лист"}
            </h3>
            <p>
              {done.length
                ? "Завершённые задачи собраны ниже."
                : all
                  ? "Добавь задачу или измени фильтры."
                  : "Добавь первое дело в план на день."}
            </p>
          </div>
        )}
      </div>
      {done.length > 0 && (
        <>
          <button
            className="done-toggle"
            onClick={() => setExpanded(!expanded)}
          >
            <ChevronDown
              size={15}
              style={{ transform: expanded ? "" : "rotate(-90deg)" }}
            />
            Выполнено · {done.length}
          </button>
          {expanded && done.map(row)}
        </>
      )}
      {!all && (
        <div className="sheet-foot">
          <Stats tasks={tasks} budget={book.budgets[day]} />
          <IconButton name="Ориентир нагрузки" onClick={() => budget?.()}>
            <SlidersHorizontal size={15} />
          </IconButton>
        </div>
      )}
    </section>
  );
}
