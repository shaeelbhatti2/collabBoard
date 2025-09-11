import { create } from "zustand";
import type { Shape, ShapeType } from "@collabboard/shared";
import { createDefaultRect } from "@collabboard/shared";

export interface ShapeStoreState {
  shapes: Shape[];
  addShape: (shape: Shape) => void;
  updateShape: (id: string, patch: Partial<Shape>) => void;
  removeShape: (id: string) => void;
  createShapeAt: (type: ShapeType, x: number, y: number) => Shape;
}

let shapeCounter = 1;

function nextId(): string {
  shapeCounter += 1;
  return `shape-${shapeCounter}`;
}

export const useShapeStore = create<ShapeStoreState>((set, get) => ({
  shapes: [],
  addShape: (shape) => set((state) => ({ shapes: [...state.shapes, shape] })),
  updateShape: (id, patch) =>
    set((state) => ({
      shapes: state.shapes.map((shape) =>
        shape.id === id ? ({ ...shape, ...patch, id: shape.id, type: shape.type } as Shape) : shape,
      ),
    })),
  removeShape: (id) => set((state) => ({ shapes: state.shapes.filter((s) => s.id !== id) })),
  createShapeAt: (type, x, y) => {
    const id = nextId();
    const boardId = "demo";
    const layerId = "default";

    if (type === "rect") {
      const shape = { ...createDefaultRect(boardId, layerId, id), x, y };
      get().addShape(shape);
      return shape;
    }

    if (type === "ellipse") {
      const shape: Shape = {
        id,
        boardId,
        layerId,
        type: "ellipse",
        x,
        y,
        width: 120,
        height: 80,
        rotation: 0,
        zIndex: get().shapes.length,
        locked: false,
        fill: "#fef3c7",
        stroke: "#92400e",
        strokeWidth: 2,
      };
      get().addShape(shape);
      return shape;
    }

    if (type === "sticky") {
      const shape: Shape = {
        id,
        boardId,
        layerId,
        type: "sticky",
        x,
        y,
        width: 160,
        height: 120,
        rotation: 0,
        zIndex: get().shapes.length,
        locked: false,
        content: "Note",
        color: "#fde68a",
      };
      get().addShape(shape);
      return shape;
    }

    if (type === "text") {
      const shape: Shape = {
        id,
        boardId,
        layerId,
        type: "text",
        x,
        y,
        width: 200,
        height: 40,
        rotation: 0,
        zIndex: get().shapes.length,
        locked: false,
        content: "Text",
        fontSize: 16,
        fontFamily: "Inter, sans-serif",
        color: "#f8fafc",
        bold: false,
        italic: false,
      };
      get().addShape(shape);
      return shape;
    }

    const shape: Shape = {
      id,
      boardId,
      layerId,
      type: "line",
      x,
      y,
      width: 140,
      height: 4,
      rotation: 0,
      zIndex: get().shapes.length,
      locked: false,
      stroke: "#38bdf8",
      strokeWidth: 3,
      points: [
        { x: 0, y: 0 },
        { x: 140, y: 0 },
      ],
    };
    get().addShape(shape);
    return shape;
  },
}));

export function screenToWorld(
  sx: number,
  sy: number,
  viewport: { x: number; y: number; zoom: number },
): { x: number; y: number } {
  return {
    x: (sx - viewport.x) / viewport.zoom,
    y: (sy - viewport.y) / viewport.zoom,
  };
}

export function drawShape(ctx: CanvasRenderingContext2D, shape: Shape): void {
  ctx.save();
  ctx.translate(shape.x + shape.width / 2, shape.y + shape.height / 2);
  ctx.rotate((shape.rotation * Math.PI) / 180);
  ctx.translate(-shape.width / 2, -shape.height / 2);

  if (shape.type === "rect") {
    ctx.fillStyle = shape.fill;
    ctx.strokeStyle = shape.stroke;
    ctx.lineWidth = shape.strokeWidth;
    ctx.beginPath();
    ctx.roundRect(0, 0, shape.width, shape.height, shape.cornerRadius);
    ctx.fill();
    ctx.stroke();
  }

  if (shape.type === "ellipse") {
    ctx.fillStyle = shape.fill;
    ctx.strokeStyle = shape.stroke;
    ctx.lineWidth = shape.strokeWidth;
    ctx.beginPath();
    ctx.ellipse(shape.width / 2, shape.height / 2, shape.width / 2, shape.height / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  if (shape.type === "sticky") {
    ctx.fillStyle = shape.color;
    ctx.fillRect(0, 0, shape.width, shape.height);
    ctx.fillStyle = "#1f2937";
    ctx.font = "14px Inter, sans-serif";
    ctx.fillText(shape.content, 12, 24, shape.width - 24);
  }

  if (shape.type === "text") {
    ctx.fillStyle = shape.color;
    ctx.font = `${shape.bold ? "bold " : ""}${shape.italic ? "italic " : ""}${shape.fontSize}px ${shape.fontFamily}`;
    ctx.fillText(shape.content, 0, shape.fontSize);
  }

  if (shape.type === "line" || shape.type === "arrow") {
    ctx.strokeStyle = shape.stroke;
    ctx.lineWidth = shape.strokeWidth;
    ctx.beginPath();
    const points = shape.points;
    if (points.length > 0) {
      ctx.moveTo(points[0]?.x ?? 0, points[0]?.y ?? 0);
      for (let i = 1; i < points.length; i += 1) {
        const point = points[i];
        if (point) {
          ctx.lineTo(point.x, point.y);
        }
      }
    }
    ctx.stroke();
  }

  ctx.restore();
}
