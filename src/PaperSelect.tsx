import { useState } from "react";
import * as Select from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { levels, type Cat } from "./model";

type Option = { value: string; label: string; color?: string };

export const categoryOptions = (cats: Cat[], all: string): Option[] => [
  { value: "", label: all },
  ...cats.map(({ id, name, color }) => ({ value: id, label: name, color })),
];

export const levelOptions = (all: string): Option[] => [
  { value: "", label: all },
  ...levels.map((label) => ({ value: label, label })),
];

export function PaperSelect({
  label,
  value,
  options,
  onChange,
  disabled,
  className = "",
}: {
  label: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}) {
  const [trigger, setTrigger] = useState<HTMLButtonElement | null>(null);
  const selected = options.find((item) => item.value === value);
  // Radix reserves the empty string for placeholders. Our empty values are selectable.
  return (
    <Select.Root
      value={"v:" + value}
      onValueChange={(encoded) => onChange(encoded.slice(2))}
      disabled={disabled}
    >
      <Select.Trigger
        ref={setTrigger}
        aria-label={label}
        className={"paper-select " + className}
      >
        {selected?.color && (
          <i className="option-dot" style={{ background: selected.color }} />
        )}
        <Select.Value />
        <Select.Icon asChild>
          <ChevronDown size={15} />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal container={trigger?.closest("dialog")}>
        <Select.Content
          className="paper-options"
          position="popper"
          sideOffset={4}
          collisionPadding={8}
          aria-label={label}
        >
          <Select.ScrollUpButton className="option-scroll">
            <ChevronUp size={14} />
          </Select.ScrollUpButton>
          <Select.Viewport>
            {options.map((item) => (
              <Select.Item
                className="paper-option"
                key={item.value}
                value={"v:" + item.value}
                textValue={item.label}
              >
                {item.color && (
                  <i
                    className="option-dot"
                    style={{ background: item.color }}
                  />
                )}
                <Select.ItemText>{item.label}</Select.ItemText>
                <Select.ItemIndicator className="option-check">
                  <Check size={15} />
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Viewport>
          <Select.ScrollDownButton className="option-scroll">
            <ChevronDown size={14} />
          </Select.ScrollDownButton>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
