import { useEffect, useState } from "react";
import { CanvasStage } from "./CanvasStage";
import { Toolbar } from "./Toolbar";

export function CanvasShell() {
  const [size, setSize] = useState({ width: 800, height: 600 });

  useEffect(() => {
    const update = () => {
      setSize({ width: window.innerWidth - 72, height: window.innerHeight - 56 });
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return (
    <div className="canvas-shell">
      <Toolbar />
      <CanvasStage width={size.width} height={size.height} />
    </div>
  );
}
