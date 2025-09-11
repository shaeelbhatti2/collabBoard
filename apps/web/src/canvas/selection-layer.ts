import { create } from "zustand";
import type { Shape } from "@collabboard/shared";
import { shapeBounds } from "@collabboard/shared";

export interface SelectionState {
  selectedIds: string[];
  selectOne: (id: string) => void;
  toggle: (id: string) => void;
  selectMany: (ids: string[]) => void;
  clear: () => void;
  isSelected: (id: string) => boolean;
}

export const useSelectionStore = create<SelectionState>((set, get) => ({
  selectedIds: [],
  selectOne: (id) => set({ selectedIds: [id] }),
  toggle: (id) => {
    const current = get().selectedIds;
    if (current.includes(id)) {
      set({ selectedIds: current.filter((item) => item !== id) });
      return;
    }
    set({ selectedIds: [...current, id] });
  },
  selectMany: (ids) => set({ selectedIds: ids }),
  clear: () => set({ selectedIds: [] }),
  isSelected: (id) => get().selectedIds.includes(id),
}));

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function selectionBounds(shapes: Shape[], ids: string[]): Bounds | null {
  const selected = shapes.filter((shape) => ids.includes(shape.id));
  if (selected.length === 0) {
    return null;
  }

  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (const shape of selected) {
    const bounds = shapeBounds(shape);
    minX = Math.min(minX, bounds.minX);
    minY = Math.min(minY, bounds.minY);
    maxX = Math.max(maxX, bounds.maxX);
    maxY = Math.max(maxY, bounds.maxY);
  }

  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

export function hitTestShape(shapes: Shape[], x: number, y: number): Shape | null {
  const sorted = [...shapes].sort((a, b) => b.zIndex - a.zIndex);
  for (const shape of sorted) {
    const bounds = shapeBounds(shape);
    if (x >= bounds.minX && x <= bounds.maxX && y >= bounds.minY && y <= bounds.maxY) {
      return shape;
    }
  }
  return null;
}

export type HandleId = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "rotate";

export function handlePositions(bounds: Bounds): Record<HandleId, { x: number; y: number }> {
  const { x, y, width, height } = bounds;
  const cx = x + width / 2;
  const cy = y + height / 2;
  return {
    nw: { x, y },
    n: { x: cx, y },
    ne: { x: x + width, y },
    e: { x: x + width, y: cy },
    se: { x: x + width, y: y + height },
    s: { x: cx, y: y + height },
    sw: { x, y: y + height },
    w: { x, y: cy },
    rotate: { x: cx, y: y - 24 },
  };
}

export function drawSelectionOverlay(
  ctx: CanvasRenderingContext2D,
  bounds: Bounds,
  zoom: number,
): void {
  ctx.save();
  ctx.strokeStyle = "#3b82f6";
  ctx.lineWidth = 1.5 / zoom;
  ctx.setLineDash([6 / zoom, 4 / zoom]);
  ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
  ctx.setLineDash([]);

  const handles = handlePositions(bounds);
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#3b82f6";
  ctx.lineWidth = 1 / zoom;

  for (const handle of Object.values(handles)) {
    const size = 8 / zoom;
    ctx.fillRect(handle.x - size / 2, handle.y - size / 2, size, size);
    ctx.strokeRect(handle.x - size / 2, handle.y - size / 2, size, size);
  }

  ctx.restore();
}

export function resizeFromHandle(
  shape: Shape,
  handle: HandleId,
  dx: number,
  dy: number,
): Partial<Shape> {
  if (handle === "se") {
    return { width: Math.max(16, shape.width + dx), height: Math.max(16, shape.height + dy) };
  }
  if (handle === "e") {
    return { width: Math.max(16, shape.width + dx) };
  }
  if (handle === "s") {
    return { height: Math.max(16, shape.height + dy) };
  }
  if (handle === "rotate") {
    return { rotation: shape.rotation + dx * 0.5 };
  }
  return {};
}
