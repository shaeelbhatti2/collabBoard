import { create } from "zustand";

export interface ViewportState {
  x: number;
  y: number;
  zoom: number;
  minZoom: number;
  maxZoom: number;
  setViewport: (patch: Partial<Pick<ViewportState, "x" | "y" | "zoom">>) => void;
  panBy: (dx: number, dy: number) => void;
  zoomAt: (factor: number, anchorX: number, anchorY: number) => void;
  reset: () => void;
}

export const useViewportStore = create<ViewportState>((set, get) => ({
  x: 0,
  y: 0,
  zoom: 1,
  minZoom: 0.1,
  maxZoom: 4,
  setViewport: (patch) => set((state) => ({ ...state, ...patch })),
  panBy: (dx, dy) => {
    const { x, y } = get();
    set({ x: x + dx, y: y + dy });
  },
  zoomAt: (factor, anchorX, anchorY) => {
    const { x, y, zoom, minZoom, maxZoom } = get();
    const nextZoom = Math.min(maxZoom, Math.max(minZoom, zoom * factor));
    const scale = nextZoom / zoom;
    const nextX = anchorX - (anchorX - x) * scale;
    const nextY = anchorY - (anchorY - y) * scale;
    set({ x: nextX, y: nextY, zoom: nextZoom });
  },
  reset: () => set({ x: 0, y: 0, zoom: 1 }),
}));

export type ToolMode = "select" | "pan" | "rect" | "ellipse" | "arrow" | "text" | "sticky";

export interface ToolState {
  mode: ToolMode;
  setMode: (mode: ToolMode) => void;
}

export const useToolStore = create<ToolState>((set) => ({
  mode: "select",
  setMode: (mode) => set({ mode }),
}));

export interface BoardUiState {
  boardId: string | null;
  boardTitle: string;
  setBoard: (boardId: string, title: string) => void;
}

export const useBoardStore = create<BoardUiState>((set) => ({
  boardId: null,
  boardTitle: "Untitled board",
  setBoard: (boardId, boardTitle) => set({ boardId, boardTitle }),
}));
