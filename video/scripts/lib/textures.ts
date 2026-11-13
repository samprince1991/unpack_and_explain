// Downloads and verifies the photo textures in src/brand/textures.ts (docs/blender.md "Textures").
//
// Files land in blender/textures/<id>/<asset>_<map>_<res>.jpg. The lock file pins each file's
// md5: a file is fetched when it's missing or doesn't match, and a texture with no lock entry
// yet takes its md5 from the Poly Haven API (which every download is checked against).
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { TextureEntry, TextureMap } from "../../src/brand/textures";

// Poly Haven's names for our map ids in GET /files/<asset>.
export const API_MAP_KEYS: Record<TextureMap, string> = { diff: "Diffuse", nor_gl: "nor_gl", rough: "Rough" };

const API = "https://api.polyhaven.com";
// Generic client name: no project or personal details in requests to outside services.
export const USER_AGENT = "texture-fetch/1.0";

export type RemoteFile = { url: string; md5: string; size: number };
export type TextureLock = Record<string, Record<string, string>>; // id -> file name -> md5

export type TextureIo = {
  fetchJson: (url: string) => Promise<unknown>;
  download: (url: string) => Promise<Buffer>;
  log: (line: string) => void;
};

export const fileName = (entry: TextureEntry, map: TextureMap) =>
  `${entry.asset}_${map}_${entry.resolution}.jpg`;

export const md5 = (bytes: Buffer) => createHash("md5").update(bytes).digest("hex");

/** The texture ids a world's Blender code loads. */
export const texturesForWorld = (catalog: Record<string, TextureEntry>, world: string | undefined) =>
  world ? Object.keys(catalog).filter((id) => catalog[id].worlds.includes(world)) : [];

/** The jpg for one map at one resolution, from a GET /files/<asset> response. */
export const pickFile = (files: unknown, entry: TextureEntry, map: TextureMap): RemoteFile => {
  const key = API_MAP_KEYS[map];
  const file = (files as Record<string, Record<string, { jpg?: RemoteFile }>>)?.[key]?.[entry.resolution]?.jpg;
  if (!file?.url || !file.md5) {
    throw new Error(`Poly Haven has no ${entry.resolution} jpg "${key}" map for ${entry.asset}`);
  }
  return file;
};

export const readLock = (path: string): TextureLock =>
  existsSync(path) ? (JSON.parse(readFileSync(path, "utf8")) as TextureLock) : {};

/** Lock text for the given ids only, stable, for the clip code hash. */
export const lockText = (lock: TextureLock, ids: string[]) =>
  JSON.stringify(
    [...ids].sort().map((id) => [id, Object.entries(lock[id] ?? {}).sort(([a], [b]) => a.localeCompare(b))]),
  );

export type EnsureOptions = {
  catalog: Record<string, TextureEntry>;
  ids: string[];
  dir: string; // blender/textures
  lockPath: string;
  io: TextureIo;
  /** Accept new upstream files: re-pin their md5 from the API instead of failing. */
  update?: boolean;
};

/** Makes sure every map of every id is on disk and matches the lock. Returns id -> map -> path. */
export const ensureTextures = async ({ catalog, ids, dir, lockPath, io, update = false }: EnsureOptions) => {
  const lock = readLock(lockPath);
  const paths: Record<string, Record<string, string>> = {};
  let lockChanged = false;
  for (const id of ids) {
    const entry = catalog[id];
    if (!entry) {
      throw new Error(`Unknown texture "${id}": add it to src/brand/textures.ts`);
    }
    const folder = join(dir, id);
    mkdirSync(folder, { recursive: true });
    const pinned = lock[id] ?? {};
    let files: unknown = null;
    const remote = async (map: TextureMap) => {
      files ??= await io.fetchJson(`${API}/files/${entry.asset}`);
      return pickFile(files, entry, map);
    };
    const next: Record<string, string> = {};
    paths[id] = {};
    for (const map of entry.maps) {
      const name = fileName(entry, map);
      const path = join(folder, name);
      paths[id][map] = path;
      const want = update ? undefined : pinned[name];
      if (want && existsSync(path) && md5(readFileSync(path)) === want) {
        next[name] = want;
        continue;
      }
      const file = await remote(map);
      if (!want && existsSync(path) && md5(readFileSync(path)) === file.md5) {
        next[name] = file.md5; // already on disk and matches upstream: just pin it
        continue;
      }
      if (want && file.md5 !== want) {
        throw new Error(
          `${id}/${name}: Poly Haven's file changed (md5 ${file.md5}, locked ${want}). ` +
            "Check it, then run: npm run textures -- --update",
        );
      }
      io.log(`[textures] ${id}: downloading ${name} (${Math.round(file.size / 1e5) / 10} MB)`);
      const bytes = await io.download(file.url);
      if (md5(bytes) !== file.md5) {
        throw new Error(`${id}/${name}: download is corrupt (md5 ${md5(bytes)}, expected ${file.md5})`);
      }
      const tmp = `${path}.part`;
      writeFileSync(tmp, bytes);
      rmSync(path, { force: true });
      renameSync(tmp, path);
      next[name] = file.md5;
    }
    if (JSON.stringify(next) !== JSON.stringify(pinned)) {
      lock[id] = next;
      lockChanged = true;
    }
  }
  if (lockChanged) {
    const sorted = Object.fromEntries(Object.entries(lock).sort(([a], [b]) => a.localeCompare(b)));
    writeFileSync(lockPath, `${JSON.stringify(sorted, null, 2)}\n`);
    io.log(`[textures] lock updated: ${lockPath}`);
  }
  return { paths, lock };
};

export const httpIo: TextureIo = {
  fetchJson: async (url) => {
    const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    if (!res.ok) {
      throw new Error(`GET ${url}: ${res.status} ${res.statusText}`);
    }
    return res.json();
  },
  download: async (url) => {
    const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    if (!res.ok) {
      throw new Error(`GET ${url}: ${res.status} ${res.statusText}`);
    }
    return Buffer.from(await res.arrayBuffer());
  },
  log: (line) => console.log(line),
};
