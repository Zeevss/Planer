import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import type { Book } from "./model";

export type Update = (fn: (b: Book) => void) => Promise<boolean>;
export function IconButton({
  name,
  children,
  onClick,
  disabled = false,
}: {
  name: string;
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className="icon-btn"
      title={name}
      aria-label={name}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = ref.current!;
    el.showModal();
    return () => el.close();
  }, []);
  return (
    <dialog
      ref={ref}
      aria-label={title}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          const r = e.currentTarget.getBoundingClientRect();
          if (
            e.clientX < r.left ||
            e.clientX > r.right ||
            e.clientY < r.top ||
            e.clientY > r.bottom
          )
            onClose();
        }
      }}
    >
      <header>
        <h2>{title}</h2>
        <IconButton name="Закрыть" onClick={onClose}>
          <X />
        </IconButton>
      </header>
      {children}
    </dialog>
  );
}
