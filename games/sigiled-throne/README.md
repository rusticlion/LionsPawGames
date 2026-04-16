# Sigiled Throne

Fresh TypeScript + Phaser prototype for the browser version of Sigiled Throne.

## Scripts

- `npm run dev` starts the Vite development server.
- `npm run build` type-checks and builds static assets into `dist`.
- `npm run test` runs pure TypeScript logic tests with Vitest.

## Current Scope

This scaffold covers Sprint 0 and the first Staff-only slice of Sprint 1:

- Phaser scene flow: Boot -> Preload -> Title -> Overworld.
- Staff Etching scene with clickable nodes, sigil palette, reset, and return controls.
- Grid-based, step-based overworld movement with facing-tile interactions.
- Artifact pickup and equipment controls: obtain artifacts from plinths, `Tab` cycles equipped artifacts, and `X` opens the equipped artifact's etching screen anywhere.
- First overworld blocker reads the Staff requirement and can be cleared in memory.
- Flow unlock appears after the first blocker and adds Flow to the Staff palette.
- Tablet artifact appears beyond the first gate and uses a 3x3 graph.
- Placeholder generated textures.
- Pure etching core for Staff, Life, Flame, Stone, and Flow.
- Unit tests for MP flooring, sequencing, locking, occupied nodes, and reset.
