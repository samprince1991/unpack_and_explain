// Runs command-line tools the way Windows needs: through a shell, with every argument quoted
// because paths can contain spaces.
import { spawnSync } from "node:child_process";

const quoted = (args: string[]) => args.map((a) => `"${a}"`);

// Output goes straight to the terminal. Returns whether the command succeeded.
export const run = (command: string, args: string[]) =>
  spawnSync(command, quoted(args), { stdio: "inherit", shell: true }).status === 0;

export const remotion = (args: string[]) => run("npx", ["remotion", ...args]);

// Remotion's bundled ffmpeg, so no system install is needed. It has loudnorm but no afade.
// Throws on failure and returns stderr, where ffmpeg writes its measurements.
export const ffmpeg = (args: string[]) => {
  const res = spawnSync("npx", ["remotion", "ffmpeg", ...quoted(args)], { encoding: "utf8", shell: true });
  if (res.status !== 0) {
    throw new Error(`ffmpeg failed:\n${res.stderr.slice(-2000)}`);
  }
  return res.stderr;
};
