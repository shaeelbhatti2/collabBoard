import * as Y from "yjs";
import type { Shape, ShapeType } from "@collabboard/shared";

export const SHAPES_MAP_KEY = "shapes";
export const META_MAP_KEY = "meta";

export function createBoardDocument(): Y.Doc {
  return new Y.Doc();
}

export function getShapesMap(doc: Y.Doc): Y.Map<Shape> {
  return doc.getMap(SHAPES_MAP_KEY);
}

export function getMetaMap(doc: Y.Doc): Y.Map<string | number | boolean> {
  return doc.getMap(META_MAP_KEY);
}

export function upsertShape(doc: Y.Doc, shape: Shape): void {
  const map = getShapesMap(doc);
  map.set(shape.id, shape);
}

export function deleteShape(doc: Y.Doc, shapeId: string): void {
  getShapesMap(doc).delete(shapeId);
}

export function getShape(doc: Y.Doc, shapeId: string): Shape | undefined {
  return getShapesMap(doc).get(shapeId);
}

export function listShapes(doc: Y.Doc): Shape[] {
  const items: Shape[] = [];
  getShapesMap(doc).forEach((shape) => {
    items.push(shape);
  });
  return items.sort((a, b) => a.zIndex - b.zIndex);
}

export function listShapesByType(doc: Y.Doc, type: ShapeType): Shape[] {
  return listShapes(doc).filter((shape) => shape.type === type);
}

export function applyShapePatch(doc: Y.Doc, shapeId: string, patch: Partial<Shape>): Shape | null {
  const existing = getShape(doc, shapeId);
  if (!existing) {
    return null;
  }
  const next = { ...existing, ...patch, id: shapeId, type: existing.type } as Shape;
  upsertShape(doc, next);
  return next;
}

export function encodeState(doc: Y.Doc): Uint8Array {
  return Y.encodeStateAsUpdate(doc);
}

export function applyUpdate(doc: Y.Doc, update: Uint8Array): void {
  Y.applyUpdate(doc, update);
}

export function mergeDocuments(base: Y.Doc, incoming: Y.Doc): Y.Doc {
  const merged = createBoardDocument();
  Y.applyUpdate(merged, Y.encodeStateAsUpdate(base));
  Y.applyUpdate(merged, Y.encodeStateAsUpdate(incoming));
  return merged;
}

export function snapshotState(doc: Y.Doc): { shapes: Shape[]; revision: number } {
  const revision = (getMetaMap(doc).get("revision") as number | undefined) ?? 0;
  return { shapes: listShapes(doc), revision };
}

export function bumpRevision(doc: Y.Doc): number {
  const map = getMetaMap(doc);
  const current = (map.get("revision") as number | undefined) ?? 0;
  const next = current + 1;
  map.set("revision", next);
  return next;
}

export function setBoardTitle(doc: Y.Doc, title: string): void {
  getMetaMap(doc).set("title", title);
}

export function getBoardTitle(doc: Y.Doc): string {
  return (getMetaMap(doc).get("title") as string | undefined) ?? "Untitled";
}

export function clearBoard(doc: Y.Doc): void {
  const map = getShapesMap(doc);
  map.forEach((_shape, key) => map.delete(key));
  bumpRevision(doc);
}

export function moveShapes(doc: Y.Doc, ids: string[], dx: number, dy: number): void {
  for (const id of ids) {
    const shape = getShape(doc, id);
    if (!shape) {
      continue;
    }
    upsertShape(doc, { ...shape, x: shape.x + dx, y: shape.y + dy });
  }
  bumpRevision(doc);
}

export function bringForward(doc: Y.Doc, shapeId: string): void {
  const shapes = listShapes(doc);
  const target = shapes.find((s) => s.id === shapeId);
  if (!target) {
    return;
  }
  const maxZ = shapes.reduce((max, s) => Math.max(max, s.zIndex), 0);
  upsertShape(doc, { ...target, zIndex: maxZ + 1 });
  bumpRevision(doc);
}

export function sendBackward(doc: Y.Doc, shapeId: string): void {
  const shapes = listShapes(doc);
  const target = shapes.find((s) => s.id === shapeId);
  if (!target) {
    return;
  }
  const minZ = shapes.reduce((min, s) => Math.min(min, s.zIndex), 0);
  upsertShape(doc, { ...target, zIndex: minZ - 1 });
  bumpRevision(doc);
}
