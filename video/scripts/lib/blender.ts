import { spawnSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

// Blender executable: BLENDER_PATH, then PATH, then the default Windows install folder.
export const findBlender = (): string | null => {
  if (process.env.BLENDER_PATH && existsSync(process.env.BLENDER_PATH)) {
    return process.env.BLENDER_PATH;
  }
  const onPath = spawnSync(process.platform === "win32" ? "where" : "which", ["blender"], {
    encoding: "utf8",
  });
  if (onPath.status === 0 && onPath.stdout.trim()) {
    return onPath.stdout.trim().split(/\r?\n/)[0];
  }
  const root = "C:/Program Files/Blender Foundation";
  if (existsSync(root)) {
    for (const v of readdirSync(root).sort().reverse()) {
      const exe = join(root, v, "blender.exe");
      if (existsSync(exe)) {
        return exe;
      }
    }
  }
  return null;
};
