# CollabBoard

Real-time collaborative whiteboard and diagramming platform built with TypeScript.

CollabBoard gives remote teams a shared infinite canvas for brainstorming, system design, retrospectives, and workshops. Multiple users draw, move, and edit shapes simultaneously with CRDT-based conflict-free merging.

## Stack

- **Monorepo:** pnpm workspaces (`apps/server`, `apps/web`, `packages/shared`, `packages/crdt`)
- **Backend:** Fastify, PostgreSQL, Redis, Yjs
- **Frontend:** React 18, Vite, HTML Canvas, Zustand

## Local setup

```bash
cp .env.example .env
pnpm install
pnpm db:up
pnpm dev
```

Server runs on http://localhost:4000, web client on http://localhost:5173.

## Project layout

```
apps/server   Fastify API + WebSocket gateway
apps/web      React canvas client
packages/shared   Shared domain types
packages/crdt     Yjs document helpers
docker/       docker-compose for Postgres + Redis
```

## Keyboard shortcuts

| Key | Action |
|-----|--------|
| V | Select / pan |
| R | Rectangle |
| T | Text |
| Delete | Remove selection |

## Sharing and permissions

Workspaces use role-based access (Owner, Editor, Viewer, Guest). Boards can be shared via expiring guest links with read-only or comment-only access.

## Export options

Boards export to PNG, SVG, PDF, and `.collboard` JSON backup format.

## Sync architecture

Each board maps to a Yjs document. WebSocket channels carry incremental updates; Redis pub/sub fans out across server instances. PostgreSQL stores debounced snapshots every 5 seconds.

## Future improvements

- OAuth2 (Google, GitHub)
- Visual snapshot diff overlay
- Plugin SDK for custom shape types
- Mobile touch gestures
