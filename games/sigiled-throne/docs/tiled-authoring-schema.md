# Sigiled Throne Tiled Authoring Schema

This document defines the room-authoring contract for Sigiled Throne.

The goal is simple:

- Tiled owns room layout, tile presentation, static collision, exits, spawns, and object placement.
- TypeScript owns puzzle rules, world-state transitions, save data, and interaction logic.

In practice, that means Tiled answers "where is it?" and runtime logic answers "what does it do?"

## Runtime Split

Keep these responsibilities separate:

- Tiled map data:
  - tile layers
  - static collision
  - spawn points
  - exit placement
  - world-interaction placement
  - inspectable placement
  - inline inspectable flavor text
- Runtime logic:
  - interaction requirements and rewards
  - blocker-cleared state
  - artifact-obtained state
  - sigil-unlocked state
  - save/load
  - dynamic visibility and blocking

Do not encode puzzle requirements or reward logic directly into Tiled.

## Recommended Asset Layout

Recommended working layout:

- `dev_assets/`
  - authoring sources: `.tmx`, `.tsx`, `.aseprite`, reference mockups
- `public/maps/`
  - exported Tiled JSON maps used by the game
- `public/tilesets/`
  - exported PNG tilesheets used by the game

Recommended workflow:

1. Author in Tiled using a `.tmx` map and project file.
2. Export each runtime room map as JSON.
3. Keep Aseprite/TMX/TSX as editable source assets.

Current parser target:

- Runtime parser: [`src/core/tiledRoomLoader.ts`](../src/core/tiledRoomLoader.ts)

## Map-Level Contract

Each runtime room map should follow these baseline settings:

- Orientation: `orthogonal`
- Grid: `16 x 12`
- Tile size: `16 x 16`
- Infinite map: `false`

Required map properties:

| Property | Type | Example | Notes |
| --- | --- | --- | --- |
| `roomId` | string | `island` | Must match runtime room id. |
| `label` | string | `Ruined Island` | Human-facing room label. |
| `theme` | string enum | `island` / `interior` | Mirrors runtime room theme. |
| `defaultSpawnId` | string | `start` | Spawn object id used when entering without an explicit target. |

Optional map properties:

| Property | Type | Example | Notes |
| --- | --- | --- | --- |
| `musicCue` | string | `island-quiet` | Future audio hook. |
| `ambientCue` | string | `shoreline` | Future ambience hook. |
| `notes` | string | `Needs inspectable pass` | Author-only note if useful. |

## Layer Contract

Use these exact layer names.

### Required Tile Layers

| Layer | Type | Purpose |
| --- | --- | --- |
| `Ground` | tile layer | Base terrain tiles. |
| `Collision` | tile layer | Static blocked terrain. Any non-empty tile blocks movement. |

### Optional Tile Layers

| Layer | Type | Purpose |
| --- | --- | --- |
| `Detail` | tile layer | Decorative tiles drawn above ground and below player. |
| `Front` | tile layer | Foreground tiles drawn above the player, like canopy or wall caps. |

### Required Object Layers

| Layer | Type | Purpose |
| --- | --- | --- |
| `Spawns` | object layer | Named spawn points for room entry and restart. |
| `Exits` | object layer | Doorways or room-transfer trigger tiles. |
| `WorldInteractions` | object layer | Pickups, shrines, gates, plinths, etc. |
| `Inspectables` | object layer | Flavor text and hint objects. |

## Tile Layer Rules

- `Collision` is for static terrain only.
- Do not place dynamic blockers like gates on `Collision`.
- A gate tile should remain walkable in the tile layers; its runtime object controls whether it currently blocks movement.
- Animated water, waterfalls, grass shimmer, and similar loops should live on visual tile layers, not on `Collision`.
- `Front` should contain only tiles that genuinely need to render above the player.

## Object Placement Rules

All gameplay objects should follow these rules:

- Use rectangle objects, not points.
- Snap them to the tile grid.
- Default size is `16 x 16`.
- Object `x` / `y` should align to the top-left corner of the occupied tile.
- One object represents one occupied gameplay tile.

This keeps Tiled authoring easy and makes tile-coordinate parsing predictable.

## Object Layer Schemas

Runtime dispatch should use the object layer name first.

Tiled custom classes are still recommended for editor validation, but the loader should not depend on Tiled's class/type field as the primary discriminator.

### Shared Visibility Properties

These optional properties can appear on `Exits`, `WorldInteractions`, and `Inspectables`.

| Property | Type | Notes |
| --- | --- | --- |
| `showIfBlockerCleared` | string enum | Show only after this blocker is cleared. |
| `hideIfBlockerCleared` | string enum | Hide after this blocker is cleared. |
| `showIfArtifactObtained` | string enum | Show only after this artifact is obtained. |
| `hideIfArtifactObtained` | string enum | Hide after this artifact is obtained. |
| `showIfSigilUnlocked` | string enum | Show only after this sigil is unlocked. |
| `hideIfSigilUnlocked` | string enum | Hide after this sigil is unlocked. |

For the current vertical slice, a single value per field is enough. If content later needs compound conditions, expand the runtime parser instead of inventing ad hoc naming.

### `Spawns`

Use for room entry targets and restart targets.

Required properties:

| Property | Type | Example | Notes |
| --- | --- | --- | --- |
| `id` | string | `start` | Unique within the map. |

Optional properties:

| Property | Type | Example | Notes |
| --- | --- | --- | --- |
| `facing` | direction enum | `down` | Default player facing when arriving at this spawn. |

Suggested object name:

- Use the same value as `id` for clarity.

### `Exits`

Use for room transfer trigger tiles.

Required properties:

| Property | Type | Example | Notes |
| --- | --- | --- | --- |
| `id` | string | `island-to-throne-antechamber` | Unique exit id. |
| `toRoomId` | string | `throne-antechamber` | Destination room id. |
| `spawnId` | string | `entry-from-island` | Spawn id in the destination room. |
| `facing` | direction enum | `right` | Player facing after transition. |

Optional properties:

| Property | Type | Example | Notes |
| --- | --- | --- | --- |
| `label` | string | `Throne Door` | UI/debug label. Falls back to object name. |

Suggested object name:

- Human-readable door label, like `Throne Door`.

### `WorldInteractions`

Use for any world object backed by runtime requirement/reward logic.

Required properties:

| Property | Type | Example | Notes |
| --- | --- | --- | --- |
| `id` | string enum | `staff-plinth` | Must match a runtime world interaction id. |

Optional properties:

| Property | Type | Example | Notes |
| --- | --- | --- | --- |
| `label` | string | `Staff Plinth` | UI/debug label. Falls back to object name. |
| `blocksMovement` | bool | `true` | Defaults to `true` for blockers/pickups on a tile. |

Suggested object name:

- Human-readable label, like `Staff Plinth`.

Current valid runtime ids:

- `staff-plinth`
- `sealed-way`
- `weave-shrine`
- `tablet-plinth`
- `tablet-gate`

### `Inspectables`

Use for flavor text, hint text, and non-progression worldbuilding interactions.

Required properties:

| Property | Type | Example | Notes |
| --- | --- | --- | --- |
| `id` | string | `salt-worn-marker` | Unique per room or globally, whichever is more convenient. |
| `text` | multiline string | `The marker is cut...` | Author-facing prose. Blank lines separate paragraphs. |

Optional properties:

| Property | Type | Example | Notes |
| --- | --- | --- | --- |
| `label` | string | `Salt-Worn Marker` | UI/debug label. Falls back to object name. |
| `blocksMovement` | bool | `true` | Defaults to `true`. |

Suggested object name:

- Human-readable label, like `Salt-Worn Marker`.

Text formatting rule:

- One blank line means a paragraph break.
- Runtime can split on blank lines and show each paragraph as a separate entry.

## Enums To Mirror In Tiled

Set these up as Tiled custom enums in the project file.

### `Direction`

- `up`
- `down`
- `left`
- `right`

### `RoomTheme`

- `island`
- `interior`

### `RoomId`

Current values:

- `island`
- `throne-antechamber`

### `WorldInteractionId`

Current values:

- `staff-plinth`
- `sealed-way`
- `weave-shrine`
- `tablet-plinth`
- `tablet-gate`

### `ArtifactId`

- `staff`
- `tablet`

### `SigilId`

- `life`
- `flame`
- `stone`
- `thread`
- `diffuse`
- `well`

### `BlockerId`

- `sealed-way`
- `tablet-gate`

## Recommended Tiled Custom Classes

These are recommended for editor ergonomics, even if runtime parsing keys off layer names.

- `Spawn`
- `Exit`
- `WorldInteraction`
- `Inspectable`

Each class should expose the properties listed above for that object category.

## Validation Checklist

Before exporting a room:

1. `roomId` matches the intended runtime room id.
2. `defaultSpawnId` exists in the `Spawns` layer.
3. Every `Exit.spawnId` exists in the destination room.
4. Every `WorldInteractions.id` matches a runtime interaction definition.
5. No dynamic gate tile is painted into `Collision`.
6. All object rectangles are snapped to `16 x 16`.
7. `Front` contains only tiles meant to render above the player.
8. Inspectable text is present and readable.

## Implementation Target For The Loader

When the engine integration lands, the room loader should:

1. Load exported Tiled JSON.
2. Validate map properties and layer presence.
3. Build room metadata from map properties.
4. Build static collision from `Collision`.
5. Build spawn lookup from `Spawns`.
6. Build exits from `Exits`.
7. Build interactables from `WorldInteractions` and `Inspectables`.
8. Apply visibility rules against current world state.
9. Render `Ground`, `Detail`, player, then `Front`.

That is the contract this document is meant to stabilize.
