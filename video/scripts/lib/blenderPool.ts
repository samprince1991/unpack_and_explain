// Runs Blender workers with a concurrency limit. The first failure stops everything.
import { spawn } from "node:child_process";

export type PoolJob = { done: Promise<void>; kill: () => void };

export const runPool = async <T>(
  tasks: T[],
  workers: number,
  start: (task: T) => PoolJob,
  onFinished?: (finished: number) => void,
): Promise<void> => {
  let next = 0;
  let finished = 0;
  const failures: unknown[] = [];
  const running = new Set<PoolJob>();
  const hasFailed = () => failures.length > 0;

  const lane = async () => {
    while (!hasFailed() && next < tasks.length) {
      const job = start(tasks[next++]);
      running.add(job);
      try {
        await job.done;
        finished++;
        onFinished?.(finished);
      } catch (error) {
        const first = !hasFailed();
        failures.push(error);
        if (first) {
          [...running].filter((j) => j !== job).forEach((j) => j.kill());
        }
      } finally {
        running.delete(job);
      }
    }
  };

  await Promise.all(Array.from({ length: Math.min(workers, tasks.length) }, lane));
  if (failures.length > 0) {
    throw failures[0];
  }
};

const TAIL_LINES = 40;

// One Blender process. Output is held back (three at once is unreadable) and shown on failure.
export const startBlender = (exe: string, scriptPath: string, args: string[]): PoolJob => {
  const child = spawn(
    exe,
    ["-b", "--factory-startup", "--python-exit-code", "1", "--python", scriptPath, "--", ...args],
    { stdio: ["ignore", "pipe", "pipe"] },
  );
  let tail: string[] = [];
  const keep = (data: Buffer) => {
    tail = [...tail, ...data.toString().split(/\r?\n/)].slice(-TAIL_LINES);
  };
  child.stdout.on("data", keep);
  child.stderr.on("data", keep);
  return {
    done: new Promise<void>((resolve, reject) => {
      child.on("error", reject);
      child.on("close", (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Blender exited with ${code}:\n${tail.join("\n")}`));
        }
      });
    }),
    kill: () => {
      child.kill();
    },
  };
};
