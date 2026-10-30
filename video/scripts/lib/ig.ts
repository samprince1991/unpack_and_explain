import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { isCarousel, type Idea } from "./tracker";

// Inputs for the instagram-agent plugin's Python tools (hookscore.py, beats.py,
// caption.py, detect.py), built from one idea.md. See scripts/ig.ts.

export type IgInputs = {
  hooks: string[]; // lines to rank with hookscore.py
  spoken: string[]; // one beat per line for beats.py (reels only)
  text: string; // what detect.py scores: the voice-over, or the slide copy
  caption: string;
};

export const igInputs = (idea: Idea): IgInputs => {
  if (isCarousel(idea)) {
    const cover = idea.slides[0]?.headline ?? idea.meta.hook;
    return {
      hooks: [cover],
      spoken: [],
      text: idea.slides.map((s) => [s.headline, s.body].filter(Boolean).join(". ")).join("\n"),
      caption: idea.caption,
    };
  }
  const vo = (id: string) => idea.sections.find((s) => s.id === id)?.voiceover ?? "";
  // beats.py treats each line as a beat, so split sections at sentence ends.
  const spoken = idea.sections.flatMap((s) => s.voiceover.match(/[^.?]+[.?]?/g)?.map((x) => x.trim()) ?? []);
  return {
    hooks: [vo("question"), vo("hook")].filter(Boolean),
    spoken: spoken.filter(Boolean),
    text: idea.sections.map((s) => s.voiceover).join("\n"),
    caption: idea.caption,
  };
};

// The plugin's skills folder: IG_SKILLS_DIR, else the installed plugin, else the marketplace clone.
export const skillsDir = (): string | null => {
  if (process.env.IG_SKILLS_DIR) {
    return process.env.IG_SKILLS_DIR;
  }
  const plugins = join(homedir(), ".claude", "plugins");
  const registry = join(plugins, "installed_plugins.json");
  if (existsSync(registry)) {
    const { plugins: installed } = JSON.parse(readFileSync(registry, "utf8")) as {
      plugins: Record<string, { installPath: string }[]>;
    };
    const key = Object.keys(installed).find((k) => k.startsWith("instagram-agent@"));
    const path = key ? installed[key][0]?.installPath : undefined;
    if (path && existsSync(join(path, "skills"))) {
      return join(path, "skills");
    }
  }
  const clone = join(plugins, "marketplaces", "instagram-agent-skill", "skills");
  return existsSync(clone) ? clone : null;
};
