import { describe, expect, it } from "vitest";
import { runPool, type PoolJob } from "./blenderPool";

const controlled = () => {
  const started: number[] = [];
  const killed: number[] = [];
  const finish = new Map<number, (err?: Error) => void>();
  const start = (task: number): PoolJob => {
    started.push(task);
    return {
      done: new Promise<void>((resolve, reject) => {
        finish.set(task, (err) => (err ? reject(err) : resolve()));
      }),
      kill: () => {
        killed.push(task);
        finish.get(task)?.(new Error("killed"));
      },
    };
  };
  return { started, killed, finish, start };
};

const tick = () => new Promise((r) => setTimeout(r, 0));

describe("runPool", () => {
  it("never exceeds the worker limit and runs everything", async () => {
    const c = controlled();
    const run = runPool([1, 2, 3], 2, c.start);
    await tick();
    expect(c.started).toEqual([1, 2]);
    c.finish.get(1)?.();
    await tick();
    expect(c.started).toEqual([1, 2, 3]);
    c.finish.get(2)?.();
    c.finish.get(3)?.();
    await expect(run).resolves.toBeUndefined();
  });

  it("on failure kills the others, starts nothing new, reports the first error", async () => {
    const c = controlled();
    const run = runPool([1, 2, 3], 2, c.start);
    await tick();
    c.finish.get(1)?.(new Error("boom"));
    await expect(run).rejects.toThrow("boom");
    expect(c.killed).toEqual([2]);
    expect(c.started).toEqual([1, 2]);
  });

  it("reports progress per finished task", async () => {
    const seen: number[] = [];
    const start = (): PoolJob => ({ done: Promise.resolve(), kill: () => undefined });
    await runPool([1, 2], 1, start, (n) => seen.push(n));
    expect(seen).toEqual([1, 2]);
  });
});
