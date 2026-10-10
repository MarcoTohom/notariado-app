import { useRef } from "react";
import { ControlProps } from "./types";
import { textValue } from "./BasicInputs";
import { dynamicInputClass as inputClass } from "../../../components/common/formStyles";
export function TextArea(p: ControlProps) {
  return (
    <div>
      <textarea
        id={p.id}
        name={p.name}
        rows={4}
        className={inputClass}
        value={textValue(p.value)}
        disabled={p.disabled}
        onChange={(e) => p.onChange(e.target.value)}
        onBlur={p.onBlur}
        aria-invalid={p.invalid}
        aria-describedby={p.describedBy}
      />
      <span className="text-xs text-slate-500">
        {textValue(p.value).length}
        {p.definition.max_length != null
          ? ` / ${p.definition.max_length}`
          : ""}{" "}
        caracteres
      </span>
    </div>
  );
}
export function RichTextInput(p: ControlProps) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const wrap = (tag: string) => {
    const text = textValue(p.value),
      start = ref.current?.selectionStart ?? text.length,
      end = ref.current?.selectionEnd ?? text.length;
    p.onChange(
      `${text.slice(0, start)}<${tag}>${text.slice(start, end)}</${tag}>${text.slice(end)}`,
    );
    ref.current?.focus();
  };
  return (
    <div>
      <div className="flex gap-3 mb-1">
        <button
          type="button"
          disabled={p.disabled}
          onClick={() => wrap("strong")}
          className="font-bold"
        >
          Negrita
        </button>
        <button
          type="button"
          disabled={p.disabled}
          onClick={() => wrap("em")}
          className="italic"
        >
          Cursiva
        </button>
        <button type="button" disabled={p.disabled} onClick={() => wrap("p")}>
          Párrafo
        </button>
      </div>
      <textarea
        ref={ref}
        id={p.id}
        name={p.name}
        rows={5}
        className={inputClass}
        disabled={p.disabled}
        value={textValue(p.value)}
        aria-invalid={p.invalid}
        aria-describedby={p.describedBy}
        onChange={(e) => p.onChange(e.target.value)}
        onBlur={p.onBlur}
      />
      <small>
        Seleccione texto y aplique formato. El contenido se limpia al guardar.
      </small>
    </div>
  );
}
