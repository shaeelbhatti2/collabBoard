export type Role = "owner" | "editor" | "viewer" | "guest";

export type BoardPermission = "owner" | "editor" | "viewer";

export type SharePermission = "read" | "comment";

export interface Timestamps {
  createdAt: string;
  updatedAt: string;
}

export interface Organization extends Timestamps {
  id: string;
  name: string;
  slug: string;
}

export interface User extends Timestamps {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface Workspace extends Timestamps {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
}

export interface WorkspaceMember extends Timestamps {
  id: string;
  workspaceId: string;
  userId: string;
  role: Role;
}

export interface Board extends Timestamps {
  id: string;
  workspaceId: string;
  title: string;
  description: string;
  tags: string[];
  archived: boolean;
  thumbnailUrl: string | null;
}

export interface BoardSnapshot extends Timestamps {
  id: string;
  boardId: string;
  label: string;
  stateBlob: string;
  shapeCount: number;
}

export interface Layer extends Timestamps {
  id: string;
  boardId: string;
  name: string;
  visible: boolean;
  locked: boolean;
  order: number;
}

export interface BaseShape {
  id: string;
  boardId: string;
  layerId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  locked: boolean;
}

export interface RectShape extends BaseShape {
  type: "rect";
  fill: string;
  stroke: string;
  strokeWidth: number;
  cornerRadius: number;
}

export interface EllipseShape extends BaseShape {
  type: "ellipse";
  fill: string;
  stroke: string;
  strokeWidth: number;
}

export interface DiamondShape extends BaseShape {
  type: "diamond";
  fill: string;
  stroke: string;
  strokeWidth: number;
}

export interface ArrowShape extends BaseShape {
  type: "arrow";
  stroke: string;
  strokeWidth: number;
  startBinding: string | null;
  endBinding: string | null;
  points: Array<{ x: number; y: number }>;
}

export interface LineShape extends BaseShape {
  type: "line";
  stroke: string;
  strokeWidth: number;
  points: Array<{ x: number; y: number }>;
}

export interface TextShape extends BaseShape {
  type: "text";
  content: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  bold: boolean;
  italic: boolean;
}

export interface StickyShape extends BaseShape {
  type: "sticky";
  content: string;
  color: string;
}

export interface FreehandShape extends BaseShape {
  type: "freehand";
  stroke: string;
  strokeWidth: number;
  points: Array<{ x: number; y: number }>;
}

export interface FrameShape extends BaseShape {
  type: "frame";
  title: string;
  childIds: string[];
}

export type Shape =
  | RectShape
  | EllipseShape
  | DiamondShape
  | ArrowShape
  | LineShape
  | TextShape
  | StickyShape
  | FreehandShape
  | FrameShape;

export type ShapeType = Shape["type"];

export interface Comment extends Timestamps {
  id: string;
  boardId: string;
  authorId: string;
  shapeId: string | null;
  x: number | null;
  y: number | null;
  body: string;
  resolved: boolean;
  parentId: string | null;
}

export interface ShareLink extends Timestamps {
  id: string;
  boardId: string;
  token: string;
  permission: SharePermission;
  expiresAt: string | null;
  revoked: boolean;
}

export interface PresenceSession {
  id: string;
  boardId: string;
  userId: string;
  displayName: string;
  color: string;
  cursorX: number;
  cursorY: number;
  selectionIds: string[];
  viewportX: number;
  viewportY: number;
  viewportZoom: number;
  lastSeenAt: string;
}

export interface AuditLogEntry extends Timestamps {
  id: string;
  organizationId: string;
  actorId: string;
  action: string;
  targetType: string;
  targetId: string;
  metadata: Record<string, string>;
}

export function isShapeType(value: string): value is ShapeType {
  return [
    "rect",
    "ellipse",
    "diamond",
    "arrow",
    "line",
    "text",
    "sticky",
    "freehand",
    "frame",
  ].includes(value);
}

export function createDefaultRect(boardId: string, layerId: string, id: string): RectShape {
  return {
    id,
    boardId,
    layerId,
    type: "rect",
    x: 0,
    y: 0,
    width: 120,
    height: 80,
    rotation: 0,
    zIndex: 0,
    locked: false,
    fill: "#ffffff",
    stroke: "#1a1a1a",
    strokeWidth: 2,
    cornerRadius: 4,
  };
}

export function shapeBounds(shape: Shape): { minX: number; minY: number; maxX: number; maxY: number } {
  return {
    minX: shape.x,
    minY: shape.y,
    maxX: shape.x + shape.width,
    maxY: shape.y + shape.height,
  };
}
