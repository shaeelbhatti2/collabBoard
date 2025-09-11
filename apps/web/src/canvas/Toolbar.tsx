import { useEffect } from "react";
import { useToolStore, type ToolMode } from "../store/canvas-store";

const shortcuts: Record<string, ToolMode> = {
  v: "select",
  h: "pan",
  r: "rect",
  o: "ellipse",
  l: "arrow",
  t: "text",
  s: "sticky",
};

export function Toolbar() {
  const mode = useToolStore((s) => s.mode);
  const setMode = useToolStore((s) => s.setMode);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }
      const next = shortcuts[event.key.toLowerCase()];
      if (next) {
        event.preventDefault();
        setMode(next);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [setMode]);

  const tools: Array<{ id: ToolMode; label: string }> = [
    { id: "select", label: "Select" },
    { id: "pan", label: "Pan" },
    { id: "rect", label: "Rect" },
    { id: "ellipse", label: "Ellipse" },
    { id: "arrow", label: "Arrow" },
    { id: "text", label: "Text" },
    { id: "sticky", label: "Sticky" },
  ];

  return (
    <aside className="toolbar">
      {tools.map((tool) => (
        <button
          key={tool.id}
          type="button"
          className={mode === tool.id ? "tool active" : "tool"}
          onClick={() => setMode(tool.id)}
        >
          {tool.label}
        </button>
      ))}
    </aside>
  );
}
