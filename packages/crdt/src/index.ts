export function createBoardDocId(boardId: string): string {
  return `board:${boardId}`;
}

export function placeholder(): string {
  return "crdt-ready";
}
