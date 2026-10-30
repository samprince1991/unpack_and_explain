import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { voice } from "../src/brand/voice";
import type { PostScript } from "../src/templates/types";
import { renderIndex } from "./lib/readme";
import { isCarousel, parseIdea, parseTaxonomy, postFolder, validateIdea, type Idea } from "./lib/tracker";

// Checks every ideas/*/idea.md against ideas/categories.yml and regenerates ideas/README.md.
// Usage (from video/): npm run tracker
const ideasDir = join(process.cwd(), "..", "ideas");

// A built reel's script.ts must say exactly what idea.md says.
const checkScriptTs = async (idea: Idea, errors: string[]) => {
  if (isCarousel(idea)) {
    return;
  }
  const folder = postFolder(idea);
  const file = join(process.cwd(), "src", "posts", folder, "script.ts");
  if (!existsSync(file)) {
    if (["built", "rendered", "posted"].includes(idea.meta.status)) {
      errors.push(`status is ${idea.meta.status} but video/src/posts/${folder}/script.ts is missing`);
    }
    return;
  }
  const { script } = (await import(`../src/posts/${folder}/script`)) as { script: PostScript };
  for (const s of idea.sections) {
    const code = script.sections.find((c) => c.id === s.id)?.voiceover;
    if (code !== s.voiceover) {
      errors.push(`${s.id} voice-over differs from script.ts (update both, then re-run TTS for it)`);
    }
  }
};

const main = async () => {
  const taxonomy = parseTaxonomy(readFileSync(join(ideasDir, "categories.yml"), "utf8"));
  const folders = readdirSync(ideasDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(join(ideasDir, d.name, "idea.md")))
    .map((d) => d.name);
  const ideas = folders.map((f) => parseIdea(f, readFileSync(join(ideasDir, f, "idea.md"), "utf8")));

  let failed = false;
  const seen = new Map<string, string>();
  for (const idea of ideas) {
    const { errors, warnings } = validateIdea(idea, taxonomy);
    const prev = seen.get(String(idea.meta.id));
    if (prev) {
      errors.push(`id ${idea.meta.id} is also used by ${prev}`);
    }
    seen.set(String(idea.meta.id), idea.folder);
    if (isCarousel(idea)) {
      const reel = ideas.find((i) => i.meta.id === idea.meta.companion_of);
      if (idea.meta.companion_of !== undefined && (!reel || isCarousel(reel))) {
        errors.push(`companion_of ${idea.meta.companion_of} is not a reel idea`);
      }
    }
    await checkScriptTs(idea, errors);
    for (const e of errors) console.log(`  ERROR ${idea.folder}: ${e}`);
    for (const w of warnings) console.log(`  warn  ${idea.folder}: ${w}`);
    failed ||= errors.length > 0;
  }

  writeFileSync(join(ideasDir, "README.md"), renderIndex(ideas, taxonomy, voice.wordsPerSecond));
  console.log(`Checked ${ideas.length} ideas, wrote ideas/README.md`);
  if (failed) {
    process.exit(1);
  }
};

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
