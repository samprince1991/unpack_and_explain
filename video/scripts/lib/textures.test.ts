import { mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { TextureEntry } from "../../src/brand/textures";
import { textures } from "../../src/brand/textures";
import { WORLDS } from "../../src/templates/types";
import { ensureTextures, fileName, lockText, md5, pickFile, texturesForWorld, type TextureIo } from "./textures";

const entry: TextureEntry = {
  source: "polyhaven",
  asset: "test_grass",
  name: "Test Grass",
  resolution: "1k",
  maps: ["diff", "rough"],
  worlds: ["coast"],
  use: "tests",
};
const catalog = { grass: entry };
const bytes = { diff: Buffer.from("diff-bytes"), rough: Buffer.from("rough-bytes") };
const api = (diff = bytes.diff) => ({
  Diffuse: { "1k": { jpg: { url: "https://x/diff", md5: md5(diff), size: diff.length } } },
  Rough: { "1k": { jpg: { url: "https://x/rough", md5: md5(bytes.rough), size: bytes.rough.length } } },
});

const fakeIo = (files: unknown, served: Record<string, Buffer>) => {
  const calls = { json: 0, downloads: [] as string[] };
  const io: TextureIo = {
    fetchJson: async () => {
      calls.json++;
      return files;
    },
    download: async (url) => {
      calls.downloads.push(url);
      return served[url];
    },
    log: () => {},
  };
  return { io, calls };
};

let dir: string;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "textures-"));
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

const run = (io: TextureIo, update = false) =>
  ensureTextures({ catalog, ids: ["grass"], dir, lockPath: join(dir, "lock.json"), io, update });

describe("catalog", () => {
  it("lists only real worlds and at least one map", () => {
    for (const [id, t] of Object.entries(textures)) {
      expect(t.maps.length, id).toBeGreaterThan(0);
      for (const w of t.worlds) {
        expect(WORLDS as readonly string[], `${id}: ${w}`).toContain(w);
      }
    }
  });
  it("gives the coast its grass and leaves the indoor worlds none", () => {
    expect(texturesForWorld(textures, "coast")).toContain("leafy_grass");
    expect(texturesForWorld(textures, "bench")).toEqual([]);
    expect(texturesForWorld(textures, undefined)).toEqual([]);
  });
});

describe("pickFile", () => {
  it("finds the jpg at the entry's resolution", () => {
    expect(pickFile(api(), entry, "diff").url).toBe("https://x/diff");
  });
  it("throws when the map or resolution is missing", () => {
    expect(() => pickFile({}, entry, "diff")).toThrow(/no 1k jpg "Diffuse"/);
  });
});

describe("ensureTextures", () => {
  const served = { "https://x/diff": bytes.diff, "https://x/rough": bytes.rough };

  it("downloads missing files and pins them in the lock", async () => {
    const { io, calls } = fakeIo(api(), served);
    const { paths } = await run(io);
    expect(calls.downloads).toHaveLength(2);
    expect(readFileSync(paths.grass.diff, "utf8")).toBe("diff-bytes");
    const lock = JSON.parse(readFileSync(join(dir, "lock.json"), "utf8"));
    expect(lock.grass[fileName(entry, "diff")]).toBe(md5(bytes.diff));
  });

  it("does nothing (no network) when files match the lock", async () => {
    await run(fakeIo(api(), served).io);
    const { io, calls } = fakeIo(api(), served);
    await run(io);
    expect(calls.json).toBe(0);
    expect(calls.downloads).toHaveLength(0);
  });

  it("re-downloads a file that was deleted or edited", async () => {
    const { paths } = await run(fakeIo(api(), served).io);
    writeFileSync(paths.grass.diff, "tampered");
    const { io, calls } = fakeIo(api(), served);
    await run(io);
    expect(calls.downloads).toEqual(["https://x/diff"]);
    expect(readFileSync(paths.grass.diff, "utf8")).toBe("diff-bytes");
  });

  it("fails when upstream changed, and re-pins with update", async () => {
    const { paths } = await run(fakeIo(api(), served).io);
    rmSync(paths.grass.diff);
    const changed = Buffer.from("new-diff");
    const fresh = { ...served, "https://x/diff": changed };
    await expect(run(fakeIo(api(changed), fresh).io)).rejects.toThrow(/file changed.*--update/);
    await run(fakeIo(api(changed), fresh).io, true);
    expect(readFileSync(paths.grass.diff, "utf8")).toBe("new-diff");
  });

  it("rejects a corrupt download and leaves no file", async () => {
    const { io } = fakeIo(api(), { ...served, "https://x/diff": Buffer.from("garbage") });
    await expect(run(io)).rejects.toThrow(/corrupt/);
    expect(existsSync(join(dir, "grass", fileName(entry, "diff")))).toBe(false);
  });

  it("pins files already on disk without downloading", async () => {
    const { paths } = await run(fakeIo(api(), served).io);
    rmSync(join(dir, "lock.json"));
    const { io, calls } = fakeIo(api(), served);
    await run(io);
    expect(calls.downloads).toHaveLength(0);
    expect(existsSync(paths.grass.rough)).toBe(true);
  });

  it("throws on an unknown id", async () => {
    await expect(
      ensureTextures({ catalog, ids: ["nope"], dir, lockPath: join(dir, "l.json"), io: fakeIo({}, {}).io }),
    ).rejects.toThrow(/Unknown texture "nope"/);
  });
});

describe("lockText", () => {
  it("covers only the given ids, in a stable order", () => {
    const lock = { b: { y: "2", x: "1" }, a: { z: "3" } };
    expect(lockText(lock, ["b"])).toBe(lockText({ b: { x: "1", y: "2" } }, ["b"]));
    expect(lockText(lock, ["a"])).not.toContain('"x"');
  });
});
