import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { voice } from "../src/brand/voice";
import { igInputs, skillsDir } from "./lib/ig";
import { isCarousel, parseIdea } from "./lib/tracker";

// Runs the instagram-agent plugin's checks on one idea: hookscore.py (question + hook,
// or carousel cover), beats.py (reels), caption.py and detect.py. Read-only: it prints
// reports, it never edits idea.md. Record hook_formula / hook_score / question_score yourself.
// Usage (from video/): npm run ig -- idea-02-gps [--keywords "gps,satellites"]
const TARGET_SECONDS = 45; // middle of the 35-52 s reel range

const folder = process.argv[2];
if (!folder) {
  console.error('Usage: npm run ig -- idea-NN-slug [--keywords "a,b"]');
  process.exit(1);
}
const kwIndex = process.argv.indexOf("--keywords");
const keywords = kwIndex > 0 ? process.argv[kwIndex + 1] : undefined;

const skills = skillsDir();
if (!skills) {
  console.error(
    "instagram-agent skills not found. Run /plugin install instagram-agent@instagram-agent-skill, or set IG_SKILLS_DIR.",
  );
  process.exit(1);
}

const idea = parseIdea(folder, readFileSync(join(process.cwd(), "..", "ideas", folder, "idea.md"), "utf8"));
const input = igInputs(idea);
const dir = mkdtempSync(join(tmpdir(), "ig-"));
const file = (name: string, text: string) => {
  const path = join(dir, name);
  writeFileSync(path, `${text}\n`);
  return path;
};

// The plugin's JSON files are UTF-8; Windows Python defaults to cp1252 without PYTHONUTF8.
const python = process.env.PYTHON ?? (process.platform === "win32" ? "python" : "python3");
const run = (title: string, script: string, args: string[]) => {
  console.log(`\n### ${title}`);
  spawnSync(python, [join(skills, script), ...args], {
    stdio: "inherit",
    env: { ...process.env, PYTHONUTF8: "1" },
  });
};

run(isCarousel(idea) ? "Cover score" : "Hook scores (question card, hook)", "ig-reel/hookscore.py", [
  file("hooks.txt", input.hooks.join("\n")),
]);
if (input.spoken.length) {
  run("Beat sheet", "ig-reel/beats.py", [
    file("beats.txt", input.spoken.join("\n")),
    "--wpm",
    String(voice.wordsPerSecond * 60),
    "--target",
    String(TARGET_SECONDS),
  ]);
}
if (input.caption) {
  const cap = file("caption.txt", input.caption);
  run("Caption lint", "ig-caption/caption.py", keywords ? [cap, "--keywords", keywords] : [cap]);
  run("AI-text check: caption", "ig-human/detect.py", [cap]);
}
if (input.text.trim()) {
  run(isCarousel(idea) ? "AI-text check: slides" : "AI-text check: voice-over", "ig-human/detect.py", [
    file("text.txt", input.text),
  ]);
}
console.log(
  "\nAdvisory: propose rewrites to the user; never change script text or facts without approval (CLAUDE.md).",
);
