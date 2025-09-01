import { describe, it, expect } from "vitest";
import { createDefaultRect } from "@collabboard/shared";
import {
  createBoardDocument,
  upsertShape,
  listShapes,
  applyShapePatch,
  mergeDocuments,
  moveShapes,
  getBoardTitle,
  setBoardTitle,
} from "./board-doc.js";

describe("board document", () => {
  it("stores and lists shapes", () => {
    const doc = createBoardDocument();
    const shape = createDefaultRect("b1", "l1", "s1");
    upsertShape(doc, shape);
    expect(listShapes(doc).length).toBe(1);
  });

  it("patches shape fields", () => {
    const doc = createBoardDocument();
    const shape = createDefaultRect("b1", "l1", "s1");
    upsertShape(doc, shape);
    const patched = applyShapePatch(doc, "s1", { x: 40, y: 50 });
    expect(patched?.x).toBe(40);
    expect(patched?.y).toBe(50);
  });

  it("merges two docs deterministically", () => {
    const left = createBoardDocument();
    const right = createBoardDocument();
    upsertShape(left, createDefaultRect("b1", "l1", "a"));
    upsertShape(right, createDefaultRect("b1", "l1", "b"));
    const merged = mergeDocuments(left, right);
    expect(listShapes(merged).length).toBe(2);
  });

  it("moves multiple shapes together", () => {
    const doc = createBoardDocument();
    upsertShape(doc, createDefaultRect("b1", "l1", "a"));
    upsertShape(doc, createDefaultRect("b1", "l1", "b"));
    moveShapes(doc, ["a", "b"], 10, 5);
    const shapes = listShapes(doc);
    expect(shapes.every((s) => s.x === 10 && s.y === 5)).toBe(true);
  });

  it("tracks board title in meta map", () => {
    const doc = createBoardDocument();
    setBoardTitle(doc, "Retro board");
    expect(getBoardTitle(doc)).toBe("Retro board");
  });
});
