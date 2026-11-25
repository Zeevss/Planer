import { useState } from "react";
import { z } from "zod";
import { Modal, type Update } from "./shared";
import { levels, dayKey, type Book } from "./model";
const str = z.string(),
  num = z.number().nonnegative().finite(),
  date = z.union([z.literal(""), z.iso.date()]),
  record = <T extends z.ZodType>(t: T) => z.record(z.iso.date(), t);
const schema = z.object({
  version: z.literal(1),
  cats: z.array(
    z.object({ id: str, name: str, color: z.string().regex(/^#[\da-f]{6}$/i) }),
  ),
  tasks: z.array(
    z.object({
      id: str,
      title: str,
      cat: str,
      level: z.enum(["", ...levels]),
      min: num,
      max: num,
      day: date,
      due: date,
      done: date,
      note: str,
      parent: str,
      resume: str.optional(),
      result: str.optional(),
    }),
  ),
  sessions: z.array(
    z.object({
      id: str,
      day: z.iso.date(),
      title: str,
      task: str,
      ms: num,
      note: str,
    }),
  ),
  journal: record(z.object({ text: str, next: str, plan: z.array(str) })),
  budgets: record(num),
  timer: z.object({
    mode: z.enum(["pom", "watch", "break"]),
    task: str,
    started: num,
    held: num,
    byDay: record(num).optional(),
    active: z.boolean(),
  }),
});
export function Backup({
  book,
  update,
  close,
}: {
  book: Book;
  update: Update;
  close: () => void;
}) {
  const [incoming, setIncoming] = useState<Book | null>(null),
    [error, setError] = useState("");
  function download() {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(book, null, 2)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "Листок-" + dayKey() + ".json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }
  return (
    <Modal title="Данные ежедневника" onClose={close}>
      <p>
        Задачи и записи хранятся в этом браузере. Сохрани копию, чтобы перенести
        ежедневник или восстановить его после очистки данных сайта.
      </p>
      <button className="secondary" onClick={download}>
        Скачать резервную копию
      </button>
      <label>
        Восстановить из копии
        <input
          type="file"
          accept=".json,application/json"
          onChange={async (e) => {
            setError("");
            setIncoming(null);
            const f = e.target.files?.[0];
            if (!f) return;
            try {
              setIncoming(schema.parse(JSON.parse(await f.text())));
            } catch {
              setError("Не удалось прочитать копию Листка. Проверь файл.");
            }
          }}
        />
      </label>
      {error && <p role="alert">{error}</p>}
      {incoming && (
        <>
          <p>
            Текущие данные будут заменены. Задач в копии:{" "}
            {incoming.tasks.length}.
          </p>
          <button
            className="primary"
            onClick={async () => {
              if (await update((b) => Object.assign(b, incoming))) close();
            }}
          >
            Заменить и восстановить
          </button>
        </>
      )}
    </Modal>
  );
}
