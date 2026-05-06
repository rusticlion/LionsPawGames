import {
  directionValues,
  getSpawnById,
  isWithinBounds,
  roomIdValues,
  sourceTileSize,
  worldInteractionIdValues,
  type GridExit,
  type GridSpawn,
  type InspectableInteractable,
  type TileCoord,
  type WorldInteractionInteractable
} from './gridNavigation';
import {
  optionalTiledTileLayers,
  requiredTiledObjectLayers,
  requiredTiledTileLayers,
  tiledLayerNames,
  tiledMapContract,
  type TiledRoomMapProperties,
  type TiledVisibilityProperties
} from './tiledSchema';
import { roomThemeValues, type RoomDefinition } from './worldRooms';
import { artifactIdValues, sigilIdValues } from './etching';
import { blockerIdValues } from './worldState';

const tiledGidMask = 0x1fffffff;

export interface TiledProperty {
  name: string;
  type?: string;
  propertytype?: string;
  value: unknown;
}

interface TiledLayerBase {
  id: number;
  name: string;
  type: string;
  visible?: boolean;
  opacity?: number;
  properties?: TiledProperty[];
}

export interface TiledTileLayer extends TiledLayerBase {
  type: 'tilelayer';
  width: number;
  height: number;
  data: number[];
}

export interface TiledObject {
  id: number;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  visible?: boolean;
  properties?: TiledProperty[];
}

export interface TiledObjectLayer extends TiledLayerBase {
  type: 'objectgroup';
  objects: TiledObject[];
}

export interface TiledTilesetReference {
  firstgid: number;
  source?: string;
  name?: string;
  image?: string;
  tilewidth?: number;
  tileheight?: number;
  tilecount?: number;
  columns?: number;
}

export interface TiledMapExport {
  width: number;
  height: number;
  tilewidth: number;
  tileheight: number;
  orientation: string;
  infinite: boolean;
  layers: Array<TiledTileLayer | TiledObjectLayer>;
  properties?: TiledProperty[];
  tilesets?: TiledTilesetReference[];
}

export interface LoadedTiledTileLayer {
  name: string;
  width: number;
  height: number;
  data: number[];
  visible: boolean;
  opacity: number;
}

export interface LoadedTiledTileLayers {
  ground: LoadedTiledTileLayer;
  collision: LoadedTiledTileLayer;
  detail?: LoadedTiledTileLayer;
  front?: LoadedTiledTileLayer;
}

export interface LoadedTiledExit extends GridExit {
  visibility?: TiledVisibilityProperties;
}

export interface LoadedTiledWorldInteraction
  extends WorldInteractionInteractable {
  visibility?: TiledVisibilityProperties;
}

export interface LoadedTiledInspectable extends InspectableInteractable {
  visibility?: TiledVisibilityProperties;
}

export type LoadedTiledInteractable =
  | LoadedTiledWorldInteraction
  | LoadedTiledInspectable;

export interface LoadedTiledRoom extends RoomDefinition {
  source: 'tiled';
  exits: LoadedTiledExit[];
  interactables: LoadedTiledInteractable[];
  tileLayers: LoadedTiledTileLayers;
  tilesets: TiledTilesetReference[];
  notes?: string;
}

export class TiledRoomValidationError extends Error {}

export function loadTiledRoom(map: TiledMapExport): LoadedTiledRoom {
  validateMapContract(map);

  const mapProperties = propertyRecord(map.properties);
  const roomProperties = parseRoomMapProperties(mapProperties);
  const groundLayer = parseRequiredTileLayer(map, tiledLayerNames.ground);
  const collisionLayer = parseRequiredTileLayer(map, tiledLayerNames.collision);
  const detailLayer = parseOptionalTileLayer(map, tiledLayerNames.detail);
  const frontLayer = parseOptionalTileLayer(map, tiledLayerNames.front);
  const spawns = parseSpawnLayer(map);
  const exits = parseExitLayer(map);
  const interactables = [
    ...parseWorldInteractionLayer(map),
    ...parseInspectableLayer(map)
  ];

  if (!getSpawnById(spawns, roomProperties.defaultSpawnId)) {
    throw new TiledRoomValidationError(
      `Map default spawn "${roomProperties.defaultSpawnId}" does not exist in ${tiledLayerNames.spawns}.`
    );
  }

  return {
    id: roomProperties.roomId,
    label: roomProperties.label,
    theme: roomProperties.theme,
    defaultSpawnId: roomProperties.defaultSpawnId,
    musicCue: roomProperties.musicCue,
    ambientCue: roomProperties.ambientCue,
    notes: roomProperties.notes,
    width: map.width,
    height: map.height,
    blockedTiles: collisionTiles(collisionLayer),
    spawns,
    interactables,
    exits,
    tileLayers: {
      ground: groundLayer,
      collision: collisionLayer,
      detail: detailLayer,
      front: frontLayer
    },
    tilesets: map.tilesets ?? [],
    source: 'tiled'
  };
}

function validateMapContract(map: TiledMapExport): void {
  if (map.orientation !== 'orthogonal') {
    throw new TiledRoomValidationError(
      `Expected orthogonal Tiled map, received "${map.orientation}".`
    );
  }

  if (map.infinite) {
    throw new TiledRoomValidationError(
      'Infinite Tiled maps are not supported for Sigiled Throne rooms.'
    );
  }

  if (
    map.width !== tiledMapContract.width ||
    map.height !== tiledMapContract.height
  ) {
    throw new TiledRoomValidationError(
      `Expected room size ${tiledMapContract.width}x${tiledMapContract.height}, received ${map.width}x${map.height}.`
    );
  }

  if (
    map.tilewidth !== tiledMapContract.tileWidth ||
    map.tileheight !== tiledMapContract.tileHeight
  ) {
    throw new TiledRoomValidationError(
      `Expected tile size ${tiledMapContract.tileWidth}x${tiledMapContract.tileHeight}, received ${map.tilewidth}x${map.tileheight}.`
    );
  }

  for (const layerName of [...requiredTiledTileLayers, ...requiredTiledObjectLayers]) {
    if (!map.layers.some((layer) => layer.name === layerName)) {
      throw new TiledRoomValidationError(
        `Missing required Tiled layer "${layerName}".`
      );
    }
  }
}

function parseRoomMapProperties(
  properties: Record<string, unknown>
): TiledRoomMapProperties {
  return {
    roomId: readEnum(properties, 'roomId', [...roomIdValues]),
    label: readString(properties, 'label'),
    theme: readEnum(properties, 'theme', [...roomThemeValues]),
    defaultSpawnId: readString(properties, 'defaultSpawnId'),
    musicCue: readOptionalString(properties, 'musicCue'),
    ambientCue: readOptionalString(properties, 'ambientCue'),
    notes: readOptionalString(properties, 'notes')
  };
}

function parseSpawnLayer(map: TiledMapExport): GridSpawn[] {
  const layer = requireObjectLayer(map, tiledLayerNames.spawns);

  return layer.objects.map((object) => {
    const properties = propertyRecord(object.properties);
    const tile = objectTile(object, map);

    return {
      id: readIdentifier(properties, object, 'spawn'),
      tile,
      facing: readOptionalEnum(properties, 'facing', [...directionValues]) ?? 'down'
    };
  });
}

function parseExitLayer(map: TiledMapExport): LoadedTiledExit[] {
  const layer = requireObjectLayer(map, tiledLayerNames.exits);

  return layer.objects.map((object) => {
    const properties = propertyRecord(object.properties);

    return {
      id: readIdentifier(properties, object, 'exit'),
      label:
        readOptionalString(properties, 'label') ??
        (object.name || readIdentifier(properties, object, 'exit')),
      tile: objectTile(object, map),
      toRoomId: readEnum(properties, 'toRoomId', [...roomIdValues]),
      spawnId: readString(properties, 'spawnId'),
      facing: readEnum(properties, 'facing', [...directionValues]),
      visibility: parseVisibility(properties)
    };
  });
}

function parseWorldInteractionLayer(
  map: TiledMapExport
): LoadedTiledWorldInteraction[] {
  const layer = requireObjectLayer(map, tiledLayerNames.worldInteractions);

  return layer.objects.map((object) => {
    const properties = propertyRecord(object.properties);
    const id = readEnum(properties, 'id', [...worldInteractionIdValues]);

    return {
      id,
      type: 'world-interaction',
      label: readOptionalString(properties, 'label') ?? (object.name || id),
      tile: objectTile(object, map),
      blocksMovement: readOptionalBoolean(properties, 'blocksMovement') ?? true,
      visibility: parseVisibility(properties)
    };
  });
}

function parseInspectableLayer(map: TiledMapExport): LoadedTiledInspectable[] {
  const layer = requireObjectLayer(map, tiledLayerNames.inspectables);

  return layer.objects.map((object) => {
    const properties = propertyRecord(object.properties);
    const id = readIdentifier(properties, object, 'inspectable');

    return {
      id,
      type: 'inspectable',
      label: readOptionalString(properties, 'label') ?? (object.name || id),
      tile: objectTile(object, map),
      blocksMovement: readOptionalBoolean(properties, 'blocksMovement') ?? true,
      text: splitInspectableText(readString(properties, 'text')),
      visibility: parseVisibility(properties)
    };
  });
}

function parseRequiredTileLayer(
  map: TiledMapExport,
  name: string
): LoadedTiledTileLayer {
  const layer = requireTileLayer(map, name);

  return parseTileLayerData(map, layer);
}

function parseOptionalTileLayer(
  map: TiledMapExport,
  name: string
): LoadedTiledTileLayer | undefined {
  const layer = map.layers.find(
    (entry): entry is TiledTileLayer =>
      entry.type === 'tilelayer' && entry.name === name
  );

  return layer ? parseTileLayerData(map, layer) : undefined;
}

function parseTileLayerData(
  map: TiledMapExport,
  layer: TiledTileLayer
): LoadedTiledTileLayer {
  if (layer.width !== map.width || layer.height !== map.height) {
    throw new TiledRoomValidationError(
      `Layer "${layer.name}" has size ${layer.width}x${layer.height}, expected ${map.width}x${map.height}.`
    );
  }

  if (layer.data.length !== layer.width * layer.height) {
    throw new TiledRoomValidationError(
      `Layer "${layer.name}" data length ${layer.data.length} does not match ${layer.width * layer.height}.`
    );
  }

  return {
    name: layer.name,
    width: layer.width,
    height: layer.height,
    data: layer.data.map(stripTiledGidFlags),
    visible: layer.visible ?? true,
    opacity: layer.opacity ?? 1
  };
}

function collisionTiles(layer: LoadedTiledTileLayer): TileCoord[] {
  const tiles: TileCoord[] = [];

  for (let index = 0; index < layer.data.length; index += 1) {
    if (layer.data[index] === 0) {
      continue;
    }

    tiles.push({
      x: index % layer.width,
      y: Math.floor(index / layer.width)
    });
  }

  return tiles;
}

function requireTileLayer(map: TiledMapExport, name: string): TiledTileLayer {
  const layer = map.layers.find(
    (entry): entry is TiledTileLayer =>
      entry.type === 'tilelayer' && entry.name === name
  );

  if (!layer) {
    throw new TiledRoomValidationError(`Missing tile layer "${name}".`);
  }

  return layer;
}

function requireObjectLayer(map: TiledMapExport, name: string): TiledObjectLayer {
  const layer = map.layers.find(
    (entry): entry is TiledObjectLayer =>
      entry.type === 'objectgroup' && entry.name === name
  );

  if (!layer) {
    throw new TiledRoomValidationError(`Missing object layer "${name}".`);
  }

  return layer;
}

function propertyRecord(
  properties: TiledProperty[] | undefined
): Record<string, unknown> {
  const entries = properties ?? [];

  return Object.fromEntries(entries.map((property) => [property.name, property.value]));
}

function objectTile(object: TiledObject, map: TiledMapExport): TileCoord {
  if (object.width !== sourceTileSize || object.height !== sourceTileSize) {
    throw new TiledRoomValidationError(
      `Object "${object.name || object.id}" must be ${sourceTileSize}x${sourceTileSize}, received ${object.width}x${object.height}.`
    );
  }

  if (object.x % sourceTileSize !== 0 || object.y % sourceTileSize !== 0) {
    throw new TiledRoomValidationError(
      `Object "${object.name || object.id}" is not snapped to the ${sourceTileSize}px grid.`
    );
  }

  const tile = {
    x: object.x / sourceTileSize,
    y: object.y / sourceTileSize
  };

  if (!Number.isInteger(tile.x) || !Number.isInteger(tile.y)) {
    throw new TiledRoomValidationError(
      `Object "${object.name || object.id}" did not resolve to integer tile coordinates.`
    );
  }

  if (
    !isWithinBounds(
      {
        width: map.width,
        height: map.height,
        blockedTiles: [],
        spawns: [],
        interactables: [],
        exits: []
      },
      tile
    )
  ) {
    throw new TiledRoomValidationError(
      `Object "${object.name || object.id}" is outside room bounds at ${tile.x},${tile.y}.`
    );
  }

  return tile;
}

function parseVisibility(
  properties: Record<string, unknown>
): TiledVisibilityProperties | undefined {
  const visibility: TiledVisibilityProperties = {};

  const showIfBlockerCleared = readOptionalEnum(
    properties,
    'showIfBlockerCleared',
    [...blockerIdValues]
  );
  const hideIfBlockerCleared = readOptionalEnum(
    properties,
    'hideIfBlockerCleared',
    [...blockerIdValues]
  );
  const showIfArtifactObtained = readOptionalEnum(
    properties,
    'showIfArtifactObtained',
    [...artifactIdValues]
  );
  const hideIfArtifactObtained = readOptionalEnum(
    properties,
    'hideIfArtifactObtained',
    [...artifactIdValues]
  );
  const showIfSigilUnlocked = readOptionalEnum(
    properties,
    'showIfSigilUnlocked',
    [...sigilIdValues]
  );
  const hideIfSigilUnlocked = readOptionalEnum(
    properties,
    'hideIfSigilUnlocked',
    [...sigilIdValues]
  );

  if (showIfBlockerCleared) {
    visibility.showIfBlockerCleared = showIfBlockerCleared;
  }

  if (hideIfBlockerCleared) {
    visibility.hideIfBlockerCleared = hideIfBlockerCleared;
  }

  if (showIfArtifactObtained) {
    visibility.showIfArtifactObtained = showIfArtifactObtained;
  }

  if (hideIfArtifactObtained) {
    visibility.hideIfArtifactObtained = hideIfArtifactObtained;
  }

  if (showIfSigilUnlocked) {
    visibility.showIfSigilUnlocked = showIfSigilUnlocked;
  }

  if (hideIfSigilUnlocked) {
    visibility.hideIfSigilUnlocked = hideIfSigilUnlocked;
  }

  return Object.keys(visibility).length > 0 ? visibility : undefined;
}

function splitInspectableText(text: string): string[] {
  return text
    .split(/\r?\n\s*\r?\n/g)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

function stripTiledGidFlags(gid: number): number {
  return (gid >>> 0) & tiledGidMask;
}

function readIdentifier(
  properties: Record<string, unknown>,
  object: TiledObject,
  kind: string
): string {
  const propertyId = readOptionalString(properties, 'id');

  if (propertyId) {
    return propertyId;
  }

  if (object.name.trim()) {
    return object.name.trim();
  }

  throw new TiledRoomValidationError(
    `Expected ${kind} object ${object.id} to provide an "id" property or object name.`
  );
}

function readString(
  properties: Record<string, unknown>,
  key: string
): string {
  const value = properties[key];

  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new TiledRoomValidationError(
      `Expected property "${key}" to be a non-empty string.`
    );
  }

  return value.trim();
}

function readOptionalString(
  properties: Record<string, unknown>,
  key: string
): string | undefined {
  const value = properties[key];

  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== 'string') {
    throw new TiledRoomValidationError(
      `Expected optional property "${key}" to be a string.`
    );
  }

  return value.trim() || undefined;
}

function readOptionalBoolean(
  properties: Record<string, unknown>,
  key: string
): boolean | undefined {
  const value = properties[key];

  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== 'boolean') {
    throw new TiledRoomValidationError(
      `Expected optional property "${key}" to be a boolean.`
    );
  }

  return value;
}

function readEnum<T extends string>(
  properties: Record<string, unknown>,
  key: string,
  values: T[]
): T {
  const value = readString(properties, key);

  if (!values.includes(value as T)) {
    throw new TiledRoomValidationError(
      `Property "${key}" must be one of ${values.join(', ')}, received "${value}".`
    );
  }

  return value as T;
}

function readOptionalEnum<T extends string>(
  properties: Record<string, unknown>,
  key: string,
  values: T[]
): T | undefined {
  const value = readOptionalString(properties, key);

  if (!value) {
    return undefined;
  }

  if (!values.includes(value as T)) {
    throw new TiledRoomValidationError(
      `Optional property "${key}" must be one of ${values.join(', ')}, received "${value}".`
    );
  }

  return value as T;
}
