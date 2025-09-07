import { VERSION } from "@collabboard/shared";
import { CanvasShell } from "./canvas/CanvasShell";
import { useBoardStore } from "./store/canvas-store";

export function App() {
  const boardTitle = useBoardStore((s) => s.boardTitle);

  return (
    <div className="shell">
      <header className="topbar">
        <h1>CollabBoard</h1>
        <span className="board-title">{boardTitle}</span>
        <span className="version">v{VERSION}</span>
      </header>
      <CanvasShell />
    </div>
  );
}
