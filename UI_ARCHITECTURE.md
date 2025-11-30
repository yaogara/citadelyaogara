# Citadels React UI Architecture

## Overview
- The legacy Vue client has been retired. The only frontend lives under `ui/`, built with **React + Vite**.
- The Node/Express server in `server/` continues to expose sockets and serves the built SPA from `ui/dist`.
- Game rules and data live in `citadels-common` and `server/src/game/**`; the React UI never mutates server logic and only interacts through sockets.

## Data flow
- `ui/src/services/gameService.ts` wraps `socket.io-client` to connect, create/join rooms, start games, and send `Move` payloads.
- Incoming `ClientGameState` payloads from the server are inflated (Maps restored) and pushed to React state; the UI renders exclusively from this authoritative state.
- `ui/src/services/statusBar.ts` converts server phases/turn states into UI prompts and action buttons.

## Card and character metadata
- Canonical character and district definitions come from `citadels-common` and are surfaced through `ui/src/constants.ts`.
- Presentation-only image paths live in `ui/src/cardMetadata.ts`, mapping district IDs to `/cards/*.jpg` assets. Missing art falls back to `/cards/placeholder.svg`.
- Static assets should be placed in `ui/public/cards/` so they are served directly by Vite.

## Running the UI
- Local UI development: `cd ui && npm install && npm run dev`
- Production build (served by the Node server): from repo root run `npm install --prefix common && npm install --prefix server && npm install --prefix ui`, then `cd server && npm run build && cd ../ui && npm run build`, and finally start the server (e.g., `cd server && npm start`).

## Project layout (frontend)
- `ui/src/App.tsx`: main React application wired to socket state.
- `ui/src/components/`: presentational components (cards, panels, etc.).
- `ui/src/services/`: socket service and phase/status helpers.
- `ui/src/constants.ts`: typed metadata for characters and districts derived from `citadels-common`.
- `ui/src/cardMetadata.ts`: image mapping and placeholder logic.
- `ui/public/cards/`: card art served at runtime (`/cards/<name>.jpg`).
