import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { voice } from "../src/brand/voice";
import type { PostScript } from "../src/templates/types";
import { parsePost, renderIndex, validatePost, type Post } from "./lib/tracker";

// Checks every posts/*/post.md and regenerates posts/README.md (plan, performance, summary).
// Usage (from video/): npm run tracker
const postsDir = join(process.cwd(), "..", "posts");

// A built post's script.ts must say exactly what post.md says.
const checkScriptTs = async (post: Post, errors: string[]) => {
  const file = join(process.cwd(), "src", "posts", post.folder, "script.ts");
  if (!existsSync(file)) {
    if (["built", "rendered", "posted"].includes(post.meta.status)) {
      errors.push(`status is ${post.meta.status} but video/src/posts/${post.folder}/script.ts is missing`);
    }
    return;
  }
  const { script } = (await import(`../src/posts/${post.folder}/script`)) as { script: PostScript };
  for (const s of post.sections) {
    const code = script.sections.find((c) => c.id === s.id)?.voiceover;
    if (code !== s.voiceover) {
      errors.push(`${s.id} voice-over differs from script.ts (update both, then re-run TTS for it)`);
    }
  }
};

const main = async () => {
  const folders = readdirSync(postsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(join(postsDir, d.name, "post.md")))
    .map((d) => d.name);
  const posts = folders.map((f) => parsePost(f, readFileSync(join(postsDir, f, "post.md"), "utf8")));

  let failed = false;
  const seen = new Map<string, string>();
  for (const post of posts) {
    const { errors, warnings } = validatePost(post);
    const prev = seen.get(String(post.meta.id));
    if (prev) {
      errors.push(`id ${post.meta.id} is also used by ${prev}`);
    }
    seen.set(String(post.meta.id), post.folder);
    await checkScriptTs(post, errors);
    for (const e of errors) console.log(`  ERROR ${post.folder}: ${e}`);
    for (const w of warnings) console.log(`  warn  ${post.folder}: ${w}`);
    failed ||= errors.length > 0;
  }

  writeFileSync(join(postsDir, "README.md"), renderIndex(posts, voice.wordsPerSecond));
  console.log(`Checked ${posts.length} posts, wrote posts/README.md`);
  if (failed) {
    process.exit(1);
  }
};

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
