import { useRef } from "react";
import { useShapeStore } from "./shape-layer";
import { useViewportStore } from "../store/canvas-store";
import { downloadBlob, exportSvg, exportViewportPng } from "./export-utils";

export function ExportMenu() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const shapes = useShapeStore((s) => s.shapes);
  const viewport = useViewportStore();

  const bindCanvas = (node: HTMLCanvasElement | null) => {
    canvasRef.current = node;
  };

  const exportPng = () => {
    const canvas = document.querySelector(".canvas-stage") as HTMLCanvasElement | null;
    if (!canvas) {
      return;
    }
    const dataUrl = exportViewportPng(canvas, shapes, viewport);
    downloadBlob("board.png", atob(dataUrl.split(",")[1] ?? ""), "image/png");
  };

  const exportSvgFile = () => {
    const canvas = document.querySelector(".canvas-stage") as HTMLCanvasElement | null;
    const width = canvas?.width ?? 1200;
    const height = canvas?.height ?? 800;
    const svg = exportSvg(shapes, width, height);
    downloadBlob("board.svg", svg, "image/svg+xml");
  };

  return (
    <div className="export-menu">
      <canvas ref={bindCanvas} className="export-hidden" width={1} height={1} />
      <button type="button" onClick={exportPng}>
        PNG
      </button>
      <button type="button" onClick={exportSvgFile}>
        SVG
      </button>
    </div>
  );
}
