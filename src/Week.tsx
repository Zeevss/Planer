import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import {
  shift,
  monday,
  shortDate,
  fmt,
  moveTask,
  dayKey,
  type Book,
  type Task,
} from "./model";
import { Stats } from "./Tasks";
import { IconButton, type Update } from "./shared";

export function Week({
  day,
  setDay,
  book,
  edit,
  add,
  update,
  openDay,
}: {
  day: string;
  setDay: (s: string) => void;
  book: Book;
  edit: (t: Task) => void;
  add: (d: string) => void;
  update: Update;
  openDay: (d: string) => void;
}) {
  const start = monday(day);
  const projects = new Set(book.tasks.map((t) => t.parent).filter(Boolean));
  function drop(e: React.DragEvent, day: string, before = "") {
    e.preventDefault();
    e.stopPropagation();
    const id = e.dataTransfer.getData("text/plain");
    if (id) void update((b) => moveTask(b, id, day, before));
  }
  return (
    <section>
      <div className="view-tools">
        <h2>
          {shortDate(start)} — {shortDate(shift(start, 6))}
        </h2>
        <div>
          <IconButton
            name="Предыдущая неделя"
            onClick={() => setDay(shift(day, -7))}
          >
            <ChevronLeft />
          </IconButton>
          <IconButton
            name="Следующая неделя"
            onClick={() => setDay(shift(day, 7))}
          >
            <ChevronRight />
          </IconButton>
        </div>
      </div>
      <div className="week-grid">
        {[...Array.from({ length: 7 }, (_, i) => shift(start, i)), ""].map(
          (d) => {
            const tasks = book.tasks.filter(
              (t) => t.day === d && !t.done && !projects.has(t.id),
            );
            return (
              <section
                className={"week-cell " + (d === dayKey() ? "current" : "")}
                key={d}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => drop(e, d)}
              >
                <header>
                  {d ? (
                    <button onClick={() => openDay(d)}>
                      {fmt(d, {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                      })}
                    </button>
                  ) : (
                    <b>Без даты</b>
                  )}
                  <IconButton
                    name={"Добавить: " + (d || "без даты")}
                    onClick={() => add(d)}
                  >
                    <Plus />
                  </IconButton>
                </header>
                {d && <Stats tasks={tasks} budget={book.budgets[d]} />}
                {tasks.map((t) => (
                  <button
                    key={t.id}
                    className="week-task"
                    draggable
                    onDragStart={(e) =>
                      e.dataTransfer.setData("text/plain", t.id)
                    }
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => drop(e, d, t.id)}
                    onClick={() => edit(t)}
                  >
                    <i
                      style={{
                        background:
                          book.cats.find((c) => c.id === t.cat)?.color ||
                          "#b6b6a6",
                      }}
                    />
                    {t.title}
                  </button>
                ))}
              </section>
            );
          },
        )}
      </div>
    </section>
  );
}
