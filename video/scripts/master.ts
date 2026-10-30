import { spawnSync } from "node:child_process";

// Loudness-masters a rendered reel for Instagram / Shorts: -14 LUFS integrated,
// true peak <= -1 dBTP. Two-pass ffmpeg loudnorm, video stream copied untouched.
// Usage: npm run master -- out/post-02-gps.mp4   ->  out/post-02-gps.master.mp4
const TARGET = { I: -14, TP: -1, LRA: 11 };

type Measured = {
  input_i: string;
  input_tp: string;
  input_lra: string;
  input_thresh: string;
  target_offset: string;
};

// Remotion's bundled ffmpeg has loudnorm, so no system ffmpeg is needed.
const ffmpeg = (args: string[]) => {
  const res = spawnSync("npx", ["remotion", "ffmpeg", ...args.map((a) => `"${a}"`)], {
    encoding: "utf8",
    shell: true,
  });
  if (res.status !== 0) {
    throw new Error(`ffmpeg failed:\n${res.stderr.slice(-2000)}`);
  }
  return res.stderr;
};

const measure = (file: string): Measured => {
  const log = ffmpeg([
    "-hide_banner",
    "-i",
    file,
    // Audio only: Remotion's ffmpeg has no encoder for sending video to the null muxer.
    "-vn",
    "-af",
    `loudnorm=I=${TARGET.I}:TP=${TARGET.TP}:LRA=${TARGET.LRA}:print_format=json`,
    "-f",
    "null",
    "-",
  ]);
  const json = log.slice(log.lastIndexOf("{"), log.lastIndexOf("}") + 1);
  return JSON.parse(json) as Measured;
};

const main = () => {
  const input = process.argv[2];
  if (!input) {
    throw new Error("Usage: npm run master -- out/<post>.mp4");
  }
  const output = input.replace(/(\.[a-z0-9]+)$/i, ".master$1");
  const isWav = /\.wav$/i.test(input);

  const m = measure(input);
  console.log(`Before: ${m.input_i} LUFS, true peak ${m.input_tp} dBTP`);

  const filter =
    `loudnorm=I=${TARGET.I}:TP=${TARGET.TP}:LRA=${TARGET.LRA}` +
    `:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}` +
    `:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true`;

  ffmpeg([
    "-y",
    "-hide_banner",
    "-i",
    input,
    ...(isWav ? [] : ["-c:v", "copy"]),
    "-af",
    filter,
    "-ar",
    "48000",
    ...(isWav ? ["-c:a", "pcm_s16le"] : ["-c:a", "aac", "-b:a", "192k"]),
    output,
  ]);

  const after = measure(output);
  console.log(`After:  ${after.input_i} LUFS, true peak ${after.input_tp} dBTP`);
  console.log(`Wrote ${output}`);
};

try {
  main();
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
}
