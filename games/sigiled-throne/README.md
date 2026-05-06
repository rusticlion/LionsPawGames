# Sigiled Throne

Fresh TypeScript + Phaser prototype for the browser version of Sigiled Throne.

## Scripts

- `npm run dev` starts the Vite development server.
- `npm run build` type-checks and builds static assets into `dist`.
- `npm run test` runs pure TypeScript logic tests with Vitest.

## Authoring Reference

- Tiled room-authoring contract: [`docs/tiled-authoring-schema.md`](./docs/tiled-authoring-schema.md)
- Tiled JSON parser/validator target: [`src/core/tiledRoomLoader.ts`](./src/core/tiledRoomLoader.ts)

## Current Scope

This scaffold covers Sprint 0 and the first Staff-only slice of Sprint 1:

- Phaser scene flow: Boot -> Preload -> Title -> Overworld.
- Staff Etching scene with clickable nodes, sigil palette, reset, and return controls.
- Etching visual layer with artifact backings, sigil glyphs, orbiting MP chits, lock-field pulses, and placement transfer animations.
- Grid-based, step-based overworld movement with facing-tile interactions.
- Low-resolution world presentation: 16x16 source tiles, 3x render scale, and 16x12 tile rooms.
- Artifact pickup and equipment controls: obtain artifacts from plinths, `Tab` cycles equipped artifacts, and `X` opens the equipped artifact's etching screen anywhere.
- Development reset control: press `R` in the overworld to clear browser save data and restart.
- Development debug overlay: press Backtick in the overworld to show room, tile, facing, object, exit, save, and progression state.
- First overworld blocker reads the Staff requirement and can be cleared in memory.
- Weave Shrine appears after the first blocker and adds Thread, Diffuse, and Well to the palette.
- Tablet artifact appears beyond the first gate and uses a 3x3 graph.
- Generic artifact predicates and world interaction requirements/rewards power gates, plinths, and shrines.
- Artifact predicate support covers total MP, node MP thresholds/exacts, charged node counts, and charged paths.
- Opening an artifact while facing a puzzle interaction highlights predicate-relevant nodes in the etching view.
- `inspectable` world objects provide flavor text and hints without progression rewards.
- Second blocker requires the Tablet to hold at least 4 total MP.
- Interacting with unmet gates shows a checklist of the missing artifact conditions.
- Room definitions for the island and a Throne antechamber, with tile exits and fade transitions.
- Tiled JSON room loader/validator parses room metadata, tile layers, spawns, exits, interactions, and inspectables into runtime room data.
- Lightweight interaction effects for pickups, shrines, and solved gates.
- Versioned `localStorage` autosave/load for world state, artifact etchings, room, tile, and facing.
- Placeholder generated textures.
- Pure etching core for Staff, Life, Flame, Stone, Thread, Diffuse, and Well.
- Unit tests for MP flooring, sequencing, sealing, Thread edges, Diffuse, Well, predicates, occupied nodes, and reset.

## Save Data

Progress autosaves to `sigiled-throne-save-v1` in browser `localStorage`.

The save currently stores:

- Unlocked sigils.
- Cleared blockers.
- Obtained and equipped artifacts.
- Current etching state for each artifact.
- Current room, tile, and facing direction.

## Visual Pipeline Notes

Idle world animations should stay presentation-only. Puzzle logic, collision, saves, and interaction requirements should read room/object state, not animation frames.

World art is authored as 16x16 source tiles and rendered at 3x scale. The default room frame is 16x12 tiles, giving a 768x576 pixel-art viewport while keeping collision, exits, and objects in tile coordinates.

Recommended split:

- Use tile-layer animation metadata for dense repeated terrain such as ocean, waves, grass, and waterfall faces. Runtime can batch these by animation id and swap tile frames on a shared timer.
- Use sprite/object animation metadata for sparse entities such as trees, plinths, shrines, gates, doors, and throne pieces.
- Keep object state separate from animation state: `closed`, `open`, `collected`, or `solved` chooses the visual/animation, while the animation loops independently.
- Treat `inspectable` as a presentation-and-text object type: interaction opens authored flavor/hint text, while progression continues to live in requirement/reward objects.
- Give decorative loops deterministic phase offsets from tile/object coordinates when a whole layer should not pulse in perfect sync.
