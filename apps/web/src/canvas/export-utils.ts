import type { Shape } from "@collabboard/shared";
import { drawShape } from "./shape-layer";

export function exportViewportPng(
  canvas: HTMLCanvasElement,
  shapes: Shape[],
  viewport: { x: number; y: number; zoom: number },
): string {
  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = canvas.width;
  exportCanvas.height = canvas.height;
  const ctx = exportCanvas.getContext("2d");
  if (!ctx) {
    return "";
  }

  ctx.fillStyle = "#12151c";
  ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
  ctx.save();
  ctx.translate(viewport.x, viewport.y);
  ctx.scale(viewport.zoom, viewport.zoom);
  for (const shape of shapes) {
    drawShape(ctx, shape);
  }
  ctx.restore();
  return exportCanvas.toDataURL("image/png");
}

export function exportSvg(shapes: Shape[], width: number, height: number): string {
  const parts = shapes.map((shape) => {
    if (shape.type === "rect") {
      return `<rect x="${shape.x}" y="${shape.y}" width="${shape.width}" height="${shape.height}" fill="${shape.fill}" stroke="${shape.stroke}" stroke-width="${shape.strokeWidth}" rx="${shape.cornerRadius}" />`;
    }
    if (shape.type === "ellipse") {
      const cx = shape.x + shape.width / 2;
      const cy = shape.y + shape.height / 2;
      return `<ellipse cx="${cx}" cy="${cy}" rx="${shape.width / 2}" ry="${shape.height / 2}" fill="${shape.fill}" stroke="${shape.stroke}" stroke-width="${shape.strokeWidth}" />`;
    }
    if (shape.type === "text") {
      return `<text x="${shape.x}" y="${shape.y + shape.fontSize}" fill="${shape.color}" font-size="${shape.fontSize}">${shape.content}</text>`;
    }
    return "";
  });

  return `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${parts.join("")}</svg>`;
}

export function downloadBlob(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
