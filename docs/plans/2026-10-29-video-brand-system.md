# Video Brand System Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the code-enforced Unpack & Explain brand system in Remotion (tokens, shared components, Reel template, TTS pipeline) and produce Post 2 ("How GPS finds you") as the first reel on it.

**Architecture:** `src/brand/` holds all brand values (no React). `src/components/` are branded building blocks that only read `src/brand/`. `src/templates/` contains pure, unit-tested logic (timeline, captions, cues, validation) plus the `Reel` component that sequences Hook → Setup → Mechanism → Payoff → CTA with transitions, captions, watermark and source line. Each post is a typed `script.ts` + bespoke scene files. VO comes from ElevenLabs via `scripts/tts.ts`, which writes `public/posts/<id>/vo.json`; without it the template falls back to estimated timing so scenes can be built before audio exists.

**Tech Stack:** Remotion 4.0.539, React 19, TypeScript 5.9, `@remotion/transitions`, `@remotion/captions`, `@remotion/media`, `@remotion/google-fonts`, Vitest, tsx, ElevenLabs REST API.

**Spec:** `docs/superpowers/specs/2026-10-29-video-brand-standards-design.md`

**Conventions for every task**
- All commands run from `video/` unless stated otherwise.
- "Commit" steps: only run if the user has approved commits for this session (repo rule). Otherwise skip and continue.
- After any `.tsx` change: `npm run lint` must pass.

---

## File map

| File | Responsibility |
|---|---|
| `video/src/brand/tokens.ts` | Colors, `withAlpha`, brand strings, type scale, video specs, audio mix |
| `video/src/brand/layout.ts` | Safe zones, content box, cover crop, screen regions |
| `video/src/brand/motion.ts` | Easing presets, durations, `clamp` options |
| `video/src/brand/fonts.ts` | Poppins + Inter loading, font families and weights |
| `video/src/brand/voice.ts` | ElevenLabs voice ID, model, settings, words/second |
| `video/src/brand/brand-guard.test.ts` | Fails if hex/rgb colors or font-family strings appear outside `src/brand/` |
| `video/scripts/lib/svg.ts` (+ test) | Strip logo backgrounds, crop viewBox |
| `video/scripts/prepare-brand-assets.ts` | Copy logo SVGs from `../logo` into `public/brand/` |
| `video/src/templates/types.ts` | `PostScript`, `VoManifest`, section ids |
| `video/src/templates/timing.ts` (+ test) | Word count, estimates, timeline, caption merge |
| `video/src/templates/alignment.ts` (+ test) | ElevenLabs character alignment → `Caption[]` |
| `video/src/templates/cues.ts` (+ test) | Find the time a word is spoken |
| `video/src/templates/validate.ts` (+ test) | Script rules (sections, CTA line, hook length, format rules) |
| `video/src/templates/vo.ts` (+ test) | Estimated VO manifest + loading `vo.json` |
| `video/src/templates/SectionContext.tsx` | `useSection`, `useCue` hooks for scenes |
| `video/src/templates/metadata.ts` | `calculateReelMetadata` |
| `video/src/templates/Reel.tsx` | The reel template |
| `video/scripts/tts.ts` | Script → mp3 per section + `vo.json` |
| `video/src/components/*.tsx` | Background, SafeArea, SafeZoneGuide, SceneCanvas, Watermark, HookTitle, Captions, StepBadge, Stamp, FailureBadge, SourceTag, CtaCard |
| `video/src/components/icons/*.tsx` | Phone, Satellite, Earth, Clock, Pin, Plane (SVG `<g>`, center origin, 100-unit box) |
| `video/src/posts/post-02-gps/` | `script.ts`, `index.tsx`, `scenes/{Hook,Setup,Mechanism,Payoff}Scene.tsx` |
| `video/src/Root.tsx` | Registers `Post02-Gps` |

---

### Task 1: Dependencies and tooling

**Files:**
- Modify: `video/package.json`, `video/tsconfig.json`
- Create: `video/vitest.config.ts`
- Delete: `video/src/Composition.tsx` (in Task 14, when Root is rewritten)

- [ ] **Step 1: Install packages (exact versions matching Remotion)**

```bash
npm i -E @remotion/transitions@4.0.539 @remotion/captions@4.0.539 @remotion/media@4.0.539 @remotion/google-fonts@4.0.539
npm i -D -E vitest tsx @types/node
```

- [ ] **Step 2: Add scripts to `video/package.json`** (keep existing ones)

```json
"scripts": {
  "dev": "remotion studio",
  "build": "remotion bundle",
  "upgrade": "remotion upgrade",
  "lint": "eslint src && tsc",
  "test": "vitest run",
  "assets": "tsx scripts/prepare-brand-assets.ts",
  "tts": "tsx --env-file=.env scripts/tts.ts"
}
```

- [ ] **Step 3: Update `video/tsconfig.json` lib** — change `"lib": ["es2015"]` to `"lib": ["ES2022"]` (needed for `Object.entries`, `Array.prototype.includes`, etc.).

- [ ] **Step 4: Create `video/vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts", "scripts/**/*.test.ts"],
    environment: "node",
  },
});
```

- [ ] **Step 5: Verify**

Run: `npx tsc --noEmit && npx vitest run --passWithNoTests`
Expected: no type errors; "No test files found" exit 0.

- [ ] **Step 6: Commit**

```bash
git add video/package.json video/package-lock.json video/tsconfig.json video/vitest.config.ts
git commit -m "chore(video): add transitions, captions, media, fonts, vitest, tsx"
```

---

### Task 2: Brand tokens, layout, motion, voice

**Files:**
- Create: `video/src/brand/tokens.ts`, `video/src/brand/layout.ts`, `video/src/brand/motion.ts`, `video/src/brand/voice.ts`
- Test: `video/src/brand/tokens.test.ts`, `video/src/brand/layout.test.ts`

- [ ] **Step 1: Write failing tests**

`video/src/brand/tokens.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { brand, withAlpha } from "./tokens";

describe("withAlpha", () => {
  it("appends a two-digit alpha channel", () => {
    expect(withAlpha("#ffffff", 0.5)).toBe("#ffffff80");
    expect(withAlpha("#0f172a", 0)).toBe("#0f172a00");
    expect(withAlpha("#0f172a", 1)).toBe("#0f172aff");
  });

  it("rejects non 6-digit hex", () => {
    expect(() => withAlpha("#fff", 0.5)).toThrow();
  });
});

describe("brand", () => {
  it("uses the canonical tagline and CTA line", () => {
    expect(brand.tagline).toBe("How things actually work");
    expect(brand.ctaLine).toBe("Follow Unpack and Explain for how things actually work.");
  });
});
```

`video/src/brand/layout.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { contentBox, coverCrop, layout } from "./layout";

describe("layout", () => {
  it("computes the IG-safe content box for 1080x1920", () => {
    expect(contentBox(1080, 1920)).toEqual({ x: 80, y: 250, width: 850, height: 1220 });
  });

  it("computes the centered 4:5 cover crop", () => {
    expect(coverCrop(1080, 1920)).toEqual({ y: 285, height: 1350 });
  });

  it("keeps every region inside the content box", () => {
    const bottom = layout.content.y + layout.content.height;
    for (const region of Object.values(layout.regions)) {
      expect(region.top).toBeGreaterThanOrEqual(layout.content.y);
      expect(region.bottom).toBeLessThanOrEqual(bottom);
    }
  });

  it("keeps the visual region inside the cover crop", () => {
    const crop = coverCrop(1080, 1920);
    expect(layout.regions.visual.top).toBeGreaterThanOrEqual(crop.y);
    expect(layout.regions.visual.bottom).toBeLessThanOrEqual(crop.y + crop.height);
  });
});
```

- [ ] **Step 2: Run tests, verify they fail**

Run: `npx vitest run src/brand`
Expected: FAIL, cannot resolve `./tokens` / `./layout`.

- [ ] **Step 3: Implement**

`video/src/brand/tokens.ts`:
```ts
// The only file allowed to contain color values. See CLAUDE.md.
export const colors = {
  bg: { base: "#0f172a", raised: "#1e293b" },
  teal: {
    100: "#99f6e4",
    300: "#5eead4",
    400: "#2dd4bf",
    600: "#0d9488",
    700: "#0f766e",
  },
  amber: { 300: "#fcd34d", 500: "#f59e0b", 600: "#d97706" },
  coral: "#FF5A5F",
  text: { primary: "#f8fafc", secondary: "#cbd5e1", muted: "#94a3b8" },
} as const;

export const withAlpha = (hex: string, alpha: number): string => {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) {
    throw new Error(`withAlpha expects #rrggbb, got ${hex}`);
  }
  const channel = Math.round(Math.min(1, Math.max(0, alpha)) * 255);
  return `${hex}${channel.toString(16).padStart(2, "0")}`;
};

export const brand = {
  name: "Unpack & Explain",
  tagline: "How things actually work",
  ctaLine: "Follow Unpack and Explain for how things actually work.",
  // TODO: confirm Instagram handle availability before first publish.
  handle: "@unpackandexplain",
  // Path under public/, e.g. "brand/music/bed.mp3". null until a licensed bed is chosen.
  music: null as string | null,
} as const;

export const typeScale = {
  hook: 104,
  title: 72,
  caption: 64,
  label: 46,
  source: 32,
} as const;

export const video = { width: 1080, height: 1920, fps: 30 } as const;

export const audioMix = {
  // ~ -20 dB under the voice.
  musicVolume: 0.1,
} as const;
```

`video/src/brand/layout.ts`:
```ts
import { video } from "./tokens";

// Instagram Reels UI overlays. Nothing important may sit in these margins.
export const safeZone = { top: 250, bottom: 450, left: 80, right: 150 } as const;

export const contentBox = (width: number, height: number) => ({
  x: safeZone.left,
  y: safeZone.top,
  width: width - safeZone.left - safeZone.right,
  height: height - safeZone.top - safeZone.bottom,
});

// Centered 4:5 area used by the feed preview of the cover frame.
export const coverCrop = (width: number, height: number) => {
  const cropHeight = Math.round((width * 5) / 4);
  return { y: Math.round((height - cropHeight) / 2), height: cropHeight };
};

const content = contentBox(video.width, video.height);

export const layout = {
  content,
  watermark: { x: content.x, y: content.y, width: 120 },
  regions: {
    // Scene visuals and the hook title. Starts below the watermark.
    visual: { top: 360, bottom: 1150 },
    captions: { top: 1170, bottom: 1390 },
    source: { top: 1400, bottom: 1470 },
  },
} as const;
```

`video/src/brand/motion.ts`:
```ts
import { Easing } from "remotion";

export const ease = {
  // Default for almost everything: no overshoot.
  smooth: Easing.spring({ damping: 200 }),
  out: Easing.bezier(0.16, 1, 0.3, 1),
  // Slight overshoot. Logo and stamps only.
  pop: Easing.spring({ damping: 12, stiffness: 160 }),
} as const;

export const durations = {
  enter: 12,
  transition: 12,
  sting: 20,
} as const;

export const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;
```

`video/src/brand/voice.ts`:
```ts
// One voice for every reel. Changing anything here changes the channel's voice.
export const voice = {
  // TODO: pick the ElevenLabs voice and paste its ID here.
  voiceId: "REPLACE_WITH_VOICE_ID",
  modelId: "eleven_multilingual_v2",
  settings: {
    stability: 0.5,
    similarity_boost: 0.75,
    style: 0,
    use_speaker_boost: true,
  },
  // Used for estimated timing before VO exists.
  wordsPerSecond: 2.5,
} as const;
```

- [ ] **Step 4: Run tests, verify they pass**

Run: `npx vitest run src/brand`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add video/src/brand
git commit -m "feat(brand): add color, type, layout, motion and voice tokens"
```

---

### Task 3: Fonts and brand guard

**Files:**
- Create: `video/src/brand/fonts.ts`
- Test: `video/src/brand/brand-guard.test.ts`

- [ ] **Step 1: Write the guard test**

`video/src/brand/brand-guard.test.ts`:
```ts
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { describe, expect, it } from "vitest";

const SRC = join(process.cwd(), "src");

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });

const sourceFiles = walk(SRC)
  .filter((f) => /\.(ts|tsx)$/.test(f))
  .filter((f) => !f.endsWith(".test.ts"))
  .filter((f) => !relative(SRC, f).startsWith(`brand${sep}`));

const offenders = (pattern: RegExp) =>
  sourceFiles.filter((f) => pattern.test(readFileSync(f, "utf8"))).map((f) => relative(SRC, f));

describe("brand guard", () => {
  it("has no color literals outside src/brand", () => {
    expect(offenders(/#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(/)).toEqual([]);
  });

  it("has no font-family strings outside src/brand", () => {
    expect(offenders(/fontFamily:\s*["'`]/)).toEqual([]);
  });
});
```

- [ ] **Step 2: Run, verify it passes** (no offending files exist yet; it must keep passing from now on)

Run: `npx vitest run src/brand/brand-guard.test.ts`
Expected: PASS. Sanity check: temporarily add `const x = "#123456";` to `src/Root.tsx`, rerun, expect FAIL listing `Root.tsx`, then remove it.

- [ ] **Step 3: Implement fonts**

`video/src/brand/fonts.ts`:
```ts
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadPoppins } from "@remotion/google-fonts/Poppins";

const poppins = loadPoppins("normal", { weights: ["600"], subsets: ["latin"] });
const inter = loadInter("normal", { weights: ["500", "600"], subsets: ["latin"] });

export const fonts = {
  heading: poppins.fontFamily,
  body: inter.fontFamily,
} as const;

export const weights = {
  heading: 600,
  bodyMedium: 500,
  bodySemibold: 600,
} as const;
```

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit && npx vitest run`
Expected: no errors, all tests pass.

- [ ] **Step 5: Commit**

```bash
git add video/src/brand
git commit -m "feat(brand): load Poppins and Inter, add brand guard test"
```

---

### Task 4: Brand logo assets

**Files:**
- Create: `video/scripts/lib/svg.ts`, `video/scripts/prepare-brand-assets.ts`
- Test: `video/scripts/lib/svg.test.ts`
- Output: `video/public/brand/avatar.svg`, `video/public/brand/stacked.svg`

The master SVGs in `logo/svg/` include a full navy background square. Videos need transparent marks, and the avatar needs a tight crop (icon spans roughly x 200-880, y 316-757 of a 1080 box).

- [ ] **Step 1: Write failing tests**

`video/scripts/lib/svg.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { cropViewBox, stripBackground } from "./svg";

const SAMPLE = `<svg width="1080" height="1080" viewBox="0 0 1080 1080">
  <g id="Background">
    <path id="bg" d="M0 0 Z" fill="url(#g)"/>
  </g>
  <g id="Avatar-Dark"><path d="M1 1"/></g>
</svg>`;

describe("stripBackground", () => {
  it("removes the Background group only", () => {
    const out = stripBackground(SAMPLE);
    expect(out).not.toContain('id="Background"');
    expect(out).toContain('id="Avatar-Dark"');
  });

  it("throws when there is no Background group", () => {
    expect(() => stripBackground("<svg></svg>")).toThrow();
  });
});

describe("cropViewBox", () => {
  it("replaces viewBox, width and height", () => {
    const out = cropViewBox(SAMPLE, { x: 190, y: 300, width: 700, height: 470 });
    expect(out).toContain('viewBox="190 300 700 470"');
    expect(out).toContain('width="700"');
    expect(out).toContain('height="470"');
  });
});
```

- [ ] **Step 2: Run, verify fail**

Run: `npx vitest run scripts`
Expected: FAIL, cannot resolve `./svg`.

- [ ] **Step 3: Implement**

`video/scripts/lib/svg.ts`:
```ts
const BACKGROUND_GROUP = /<g id="Background">[\s\S]*?<\/g>\s*/;

export const stripBackground = (svg: string): string => {
  if (!BACKGROUND_GROUP.test(svg)) {
    throw new Error('SVG has no <g id="Background"> group');
  }
  return svg.replace(BACKGROUND_GROUP, "");
};

export const cropViewBox = (
  svg: string,
  box: { x: number; y: number; width: number; height: number },
): string =>
  svg
    .replace(/viewBox="[^"]*"/, `viewBox="${box.x} ${box.y} ${box.width} ${box.height}"`)
    .replace(/(<svg[^>]*?)\swidth="[^"]*"/, `$1 width="${box.width}"`)
    .replace(/(<svg[^>]*?)\sheight="[^"]*"/, `$1 height="${box.height}"`);
```

`video/scripts/prepare-brand-assets.ts`:
```ts
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { cropViewBox, stripBackground } from "./lib/svg";

const LOGO_DIR = join(process.cwd(), "..", "logo", "svg");
const OUT_DIR = join(process.cwd(), "public", "brand");

const read = (name: string) => readFileSync(join(LOGO_DIR, name), "utf8");

mkdirSync(OUT_DIR, { recursive: true });

writeFileSync(
  join(OUT_DIR, "avatar.svg"),
  cropViewBox(stripBackground(read("unpack-and-explain_Avatar-Dark.svg")), {
    x: 190,
    y: 300,
    width: 700,
    height: 470,
  }),
);

writeFileSync(
  join(OUT_DIR, "stacked.svg"),
  stripBackground(read("unpack-and-explain_Stacked-Dark.svg")),
);

console.log(`Wrote avatar.svg and stacked.svg to ${OUT_DIR}`);
```

- [ ] **Step 4: Run tests, then generate assets**

Run: `npx vitest run scripts && npm run assets`
Expected: tests PASS; prints "Wrote avatar.svg and stacked.svg ...".

- [ ] **Step 5: Visually check** the two files by opening them with the Read tool (or a browser). Avatar: box + gear, no navy square, little padding. Stacked: logo + wordmark + "How things actually work", transparent background. If the avatar crop clips the flaps or gear, widen the box and rerun.

- [ ] **Step 6: Commit**

```bash
git add video/scripts video/public/brand
git commit -m "feat(brand): generate transparent avatar and stacked logos for video"
```

---

### Task 5: Script and VO types, timeline math

**Files:**
- Create: `video/src/templates/types.ts`, `video/src/templates/timing.ts`
- Test: `video/src/templates/timing.test.ts`

- [ ] **Step 1: Create types** (no test needed, types only)

`video/src/templates/types.ts`:
```ts
import type { Caption } from "@remotion/captions";

export type Format = "E" | "F" | "Q";

export const SECTION_ORDER = ["hook", "setup", "mechanism", "payoff", "cta"] as const;
export type SectionId = (typeof SECTION_ORDER)[number];

export type ScriptSection = {
  id: SectionId;
  // Copied verbatim from Posts/post_N/script.md.
  voiceover: string;
  // The script's Visual / animation note, kept for reference.
  visual: string;
};

export type PostScript = {
  // Folder name under src/posts and public/posts, e.g. "post-02-gps".
  id: string;
  postNumber: number;
  format: Format;
  title: string;
  // Short on-screen hook (max 2 lines), shown from frame 0.
  hookText: string;
  // One word of hookText to color amber.
  hookHighlight?: string;
  // Shown as "Source: ..." for the last 3 s.
  source: string;
  // F posts only: section that gets the WHEN IT FAILED badge.
  failureSection?: SectionId;
  sections: ScriptSection[];
  // Facts flagged "verify" in the script. Must be checked before rendering.
  verify: string[];
};

export type VoSection = {
  id: SectionId;
  // The exact text that was synthesized. Used to detect stale audio.
  text: string;
  // Path under public/, or null when timing is estimated.
  file: string | null;
  durationMs: number;
  // Section-local timings.
  captions: Caption[];
};

export type VoManifest = {
  postId: string;
  estimated: boolean;
  sections: VoSection[];
};
```

- [ ] **Step 2: Write failing tests**

`video/src/templates/timing.test.ts`:
```ts
import type { Caption } from "@remotion/captions";
import { describe, expect, it } from "vitest";
import {
  computeTimeline,
  countWords,
  estimateCaptions,
  estimateDurationMs,
  mergeCaptions,
  msToFrames,
} from "./timing";
import type { VoSection } from "./types";

const cap = (text: string, startMs: number, endMs: number): Caption => ({
  text,
  startMs,
  endMs,
  timestampMs: null,
  confidence: null,
});

describe("countWords / estimateDurationMs", () => {
  it("counts words separated by any whitespace", () => {
    expect(countWords("  GPS doesn't\ttrack you. ")).toBe(4);
  });

  it("estimates duration from words per second", () => {
    expect(estimateDurationMs("one two three four five", 2.5)).toBe(2000);
  });
});

describe("msToFrames", () => {
  it("rounds up so audio is never cut", () => {
    expect(msToFrames(1000, 30)).toBe(30);
    expect(msToFrames(1001, 30)).toBe(31);
  });
});

describe("computeTimeline", () => {
  it("adds tail pad, transition overlap and the CTA minimum", () => {
    const { sections, totalFrames } = computeTimeline(
      [
        { id: "hook", durationMs: 1000 },
        { id: "cta", durationMs: 2000 },
      ],
      30,
      12,
    );
    // hook: 30 audio + 6 pad + 12 transition overlap
    expect(sections[0]).toEqual({ id: "hook", from: 0, durationInFrames: 48 });
    // cta: max(60 + 6, 90 minimum), starts where the transition begins
    expect(sections[1]).toEqual({ id: "cta", from: 36, durationInFrames: 90 });
    expect(totalFrames).toBe(126);
  });

  it("matches TransitionSeries total = sum - transitions", () => {
    const { sections, totalFrames } = computeTimeline(
      [
        { id: "hook", durationMs: 3000 },
        { id: "setup", durationMs: 5000 },
        { id: "cta", durationMs: 4000 },
      ],
      30,
      12,
    );
    const sum = sections.reduce((n, s) => n + s.durationInFrames, 0);
    expect(totalFrames).toBe(sum - 2 * 12);
  });
});

describe("estimateCaptions", () => {
  it("spreads words evenly with a leading space after the first", () => {
    expect(estimateCaptions("a b", 1000)).toEqual([cap("a", 0, 500), cap(" b", 500, 1000)]);
  });
});

describe("mergeCaptions", () => {
  it("offsets each section by its start and normalizes spacing", () => {
    const vo: VoSection[] = [
      { id: "hook", text: "", file: null, durationMs: 1000, captions: [cap("Hi", 0, 400)] },
      { id: "cta", text: "", file: null, durationMs: 1000, captions: [cap("Go", 0, 300)] },
    ];
    const timings = [
      { id: "hook" as const, from: 0, durationInFrames: 48 },
      { id: "cta" as const, from: 36, durationInFrames: 90 },
    ];
    expect(mergeCaptions(vo, timings, 30)).toEqual([cap("Hi", 0, 400), cap(" Go", 1200, 1500)]);
  });
});
```

- [ ] **Step 3: Run, verify fail**

Run: `npx vitest run src/templates/timing.test.ts`
Expected: FAIL, cannot resolve `./timing`.

- [ ] **Step 4: Implement**

`video/src/templates/timing.ts`:
```ts
import type { Caption } from "@remotion/captions";
import type { SectionId, VoSection } from "./types";

// Breathing room after each section's last word.
export const TAIL_PAD_FRAMES = 6;
export const CTA_MIN_SECONDS = 3;
export const SOURCE_LEAD_SECONDS = 3;

export const countWords = (text: string): number =>
  text.trim().split(/\s+/).filter(Boolean).length;

export const estimateDurationMs = (text: string, wordsPerSecond: number): number =>
  Math.round((countWords(text) / wordsPerSecond) * 1000);

export const msToFrames = (ms: number, fps: number): number => Math.ceil((ms / 1000) * fps);

export type SectionTiming = { id: SectionId; from: number; durationInFrames: number };

// Every section except the last is extended by the transition length, so its audio
// finishes before the next section fades in. Matches TransitionSeries' overlap math.
export const computeTimeline = (
  sections: { id: SectionId; durationMs: number }[],
  fps: number,
  transitionFrames: number,
): { sections: SectionTiming[]; totalFrames: number } => {
  let cursor = 0;
  const timings = sections.map((section, i) => {
    const isLast = i === sections.length - 1;
    const audioFrames = msToFrames(section.durationMs, fps) + TAIL_PAD_FRAMES;
    const minimum = section.id === "cta" ? CTA_MIN_SECONDS * fps : 0;
    const durationInFrames = Math.max(audioFrames, minimum) + (isLast ? 0 : transitionFrames);
    const timing = { id: section.id, from: cursor, durationInFrames };
    cursor += durationInFrames - (isLast ? 0 : transitionFrames);
    return timing;
  });
  return { sections: timings, totalFrames: cursor };
};

export const estimateCaptions = (text: string, durationMs: number): Caption[] => {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const step = durationMs / words.length;
  return words.map((word, i) => ({
    text: i === 0 ? word : ` ${word}`,
    startMs: Math.round(i * step),
    endMs: Math.round((i + 1) * step),
    timestampMs: null,
    confidence: null,
  }));
};

// Section-local captions -> one global list for the whole reel.
export const mergeCaptions = (
  vo: VoSection[],
  timings: SectionTiming[],
  fps: number,
): Caption[] =>
  vo
    .flatMap((section) => {
      const timing = timings.find((t) => t.id === section.id);
      if (!timing) {
        throw new Error(`No timing for section ${section.id}`);
      }
      const offset = (timing.from / fps) * 1000;
      return section.captions.map((c) => ({
        ...c,
        startMs: c.startMs + offset,
        endMs: c.endMs + offset,
        timestampMs: c.timestampMs === null ? null : c.timestampMs + offset,
      }));
    })
    .map((c, i) => {
      const word = c.text.trimStart();
      return { ...c, text: i === 0 ? word : ` ${word}` };
    });
```

- [ ] **Step 5: Run, verify pass**

Run: `npx vitest run src/templates/timing.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 6: Commit**

```bash
git add video/src/templates
git commit -m "feat(templates): add script/VO types and timeline math"
```

---

### Task 6: ElevenLabs alignment → captions, and word cues

**Files:**
- Create: `video/src/templates/alignment.ts`, `video/src/templates/cues.ts`
- Test: `video/src/templates/alignment.test.ts`, `video/src/templates/cues.test.ts`

ElevenLabs `POST /v1/text-to-speech/{voice_id}/with-timestamps` returns `{ audio_base64, alignment: { characters, character_start_times_seconds, character_end_times_seconds } }`.

- [ ] **Step 1: Write failing tests**

`video/src/templates/alignment.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { alignmentToCaptions } from "./alignment";

const align = (text: string, perChar = 0.1) => ({
  characters: text.split(""),
  character_start_times_seconds: text.split("").map((_, i) => i * perChar),
  character_end_times_seconds: text.split("").map((_, i) => (i + 1) * perChar),
});

describe("alignmentToCaptions", () => {
  it("groups characters into words with ms timings", () => {
    expect(alignmentToCaptions(align("Hi you."))).toEqual([
      { text: "Hi", startMs: 0, endMs: 200, timestampMs: 100, confidence: null },
      { text: " you.", startMs: 300, endMs: 700, timestampMs: 500, confidence: null },
    ]);
  });

  it("ignores repeated and trailing whitespace", () => {
    expect(alignmentToCaptions(align("a  b ")).map((c) => c.text)).toEqual(["a", " b"]);
  });

  it("throws on mismatched arrays", () => {
    expect(() =>
      alignmentToCaptions({
        characters: ["a"],
        character_start_times_seconds: [],
        character_end_times_seconds: [0.1],
      }),
    ).toThrow();
  });
});
```

`video/src/templates/cues.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { findCueMs } from "./cues";

const caps = [" Three", " distances,", " phone's"].map((text, i) => ({
  text,
  startMs: i * 1000,
  endMs: i * 1000 + 500,
  timestampMs: null,
  confidence: null,
}));

describe("findCueMs", () => {
  it("matches case- and punctuation-insensitively", () => {
    expect(findCueMs(caps, "three")).toBe(0);
    expect(findCueMs(caps, "Distances")).toBe(1000);
    expect(findCueMs(caps, "phone's")).toBe(2000);
  });

  it("returns null when the word is not spoken", () => {
    expect(findCueMs(caps, "fourth")).toBeNull();
  });
});
```

- [ ] **Step 2: Run, verify fail**

Run: `npx vitest run src/templates/alignment.test.ts src/templates/cues.test.ts`
Expected: FAIL, modules not found.

- [ ] **Step 3: Implement**

`video/src/templates/alignment.ts`:
```ts
import type { Caption } from "@remotion/captions";

export type Alignment = {
  characters: string[];
  character_start_times_seconds: number[];
  character_end_times_seconds: number[];
};

export const alignmentToCaptions = (alignment: Alignment): Caption[] => {
  const { characters, character_start_times_seconds: starts, character_end_times_seconds: ends } =
    alignment;
  if (characters.length !== starts.length || characters.length !== ends.length) {
    throw new Error("Alignment arrays have different lengths");
  }

  const captions: Caption[] = [];
  let word = "";
  let start = 0;
  let end = 0;

  const flush = () => {
    if (!word) {
      return;
    }
    captions.push({
      text: captions.length === 0 ? word : ` ${word}`,
      startMs: Math.round(start * 1000),
      endMs: Math.round(end * 1000),
      timestampMs: Math.round(((start + end) / 2) * 1000),
      confidence: null,
    });
    word = "";
  };

  characters.forEach((char, i) => {
    if (/\s/.test(char)) {
      flush();
      return;
    }
    if (!word) {
      start = starts[i];
    }
    word += char;
    end = ends[i];
  });
  flush();

  return captions;
};
```

`video/src/templates/cues.ts`:
```ts
import type { Caption } from "@remotion/captions";

const normalize = (text: string) => text.toLowerCase().replace(/[^a-z0-9']/g, "");

// Section-local time (ms) at which `word` is first spoken, or null.
export const findCueMs = (captions: Caption[], word: string): number | null => {
  const target = normalize(word);
  const match = captions.find((c) => normalize(c.text) === target);
  return match ? match.startMs : null;
};
```

- [ ] **Step 4: Run, verify pass**

Run: `npx vitest run src/templates`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add video/src/templates
git commit -m "feat(templates): convert TTS alignment to captions, add word cues"
```

---

### Task 7: Script validation and VO manifest loading

**Files:**
- Create: `video/src/templates/validate.ts`, `video/src/templates/vo.ts`
- Test: `video/src/templates/validate.test.ts`, `video/src/templates/vo.test.ts`

- [ ] **Step 1: Write failing tests**

`video/src/templates/validate.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { brand } from "../brand/tokens";
import type { PostScript } from "./types";
import { validateScript } from "./validate";

const words = (n: number) => Array.from({ length: n }, () => "word").join(" ");

const base: PostScript = {
  id: "post-99-test",
  postNumber: 99,
  format: "E",
  title: "Test",
  hookText: "Short hook",
  source: "Somewhere.gov",
  verify: [],
  sections: [
    { id: "hook", voiceover: words(10), visual: "" },
    { id: "setup", voiceover: words(15), visual: "" },
    { id: "mechanism", voiceover: words(40), visual: "" },
    { id: "payoff", voiceover: words(26), visual: "" },
    { id: "cta", voiceover: brand.ctaLine, visual: "" },
  ],
};

describe("validateScript", () => {
  it("accepts a valid E script", () => {
    expect(validateScript(base)).toEqual({ errors: [], warnings: [] });
  });

  it("requires the exact section order", () => {
    const s = { ...base, sections: [...base.sections].reverse() };
    expect(validateScript(s).errors[0]).toMatch(/Sections must be/);
  });

  it("requires a source", () => {
    expect(validateScript({ ...base, source: " " }).errors).toContain("source is required");
  });

  it("limits hook text to 2 lines", () => {
    const s = { ...base, hookText: "This hook is far too long for two lines" };
    expect(validateScript(s).errors[0]).toMatch(/hookText/);
  });

  it("enforces the canonical CTA line", () => {
    const sections = base.sections.map((x) =>
      x.id === "cta" ? { ...x, voiceover: "Follow us for how the world actually works." } : x,
    );
    expect(validateScript({ ...base, sections }).errors[0]).toMatch(/CTA voiceover/);
  });

  it("requires failureSection on F posts and forbids it elsewhere", () => {
    expect(validateScript({ ...base, format: "F" }).errors).toContain(
      "F posts need failureSection",
    );
    expect(validateScript({ ...base, failureSection: "payoff" }).errors).toContain(
      "failureSection is only for F posts",
    );
  });

  it("warns when spoken words are outside 90-110", () => {
    const sections = base.sections.map((x) =>
      x.id === "mechanism" ? { ...x, voiceover: words(80) } : x,
    );
    expect(validateScript({ ...base, sections }).warnings[0]).toMatch(/outside 90-110/);
  });
});
```

`video/src/templates/vo.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import type { PostScript, VoManifest } from "./types";
import { buildEstimatedManifest, staleSections } from "./vo";

const script = {
  id: "post-99-test",
  sections: [
    { id: "hook", voiceover: "one two three four five", visual: "" },
    { id: "cta", voiceover: "six seven", visual: "" },
  ],
} as unknown as PostScript;

describe("buildEstimatedManifest", () => {
  it("estimates durations and captions without audio files", () => {
    const m = buildEstimatedManifest(script, 2.5);
    expect(m.estimated).toBe(true);
    expect(m.sections.map((s) => [s.id, s.durationMs, s.file])).toEqual([
      ["hook", 2000, null],
      ["cta", 800, null],
    ]);
    expect(m.sections[0].captions).toHaveLength(5);
  });
});

describe("staleSections", () => {
  it("lists sections whose synthesized text differs from the script", () => {
    const vo: VoManifest = {
      postId: script.id,
      estimated: false,
      sections: [
        { id: "hook", text: "one two three four five", file: "a.mp3", durationMs: 1, captions: [] },
        { id: "cta", text: "old text", file: "b.mp3", durationMs: 1, captions: [] },
      ],
    };
    expect(staleSections(script, vo)).toEqual(["cta"]);
  });
});
```

- [ ] **Step 2: Run, verify fail**

Run: `npx vitest run src/templates/validate.test.ts src/templates/vo.test.ts`
Expected: FAIL, modules not found.

- [ ] **Step 3: Implement**

`video/src/templates/validate.ts`:
```ts
import { brand } from "../brand/tokens";
import { countWords } from "./timing";
import { SECTION_ORDER, type PostScript } from "./types";

// ~2 lines at the hook font size inside the content box.
export const HOOK_MAX_CHARS = 28;
export const WORD_RANGE = { min: 90, max: 110 } as const;

export const validateScript = (script: PostScript) => {
  const errors: string[] = [];
  const warnings: string[] = [];

  const ids = script.sections.map((s) => s.id);
  if (ids.join(",") !== SECTION_ORDER.join(",")) {
    errors.push(`Sections must be ${SECTION_ORDER.join(" > ")}, got ${ids.join(" > ")}`);
  }
  if (!script.source.trim()) {
    errors.push("source is required");
  }
  if (script.hookText.length > HOOK_MAX_CHARS) {
    errors.push(`hookText must be at most ${HOOK_MAX_CHARS} characters (2 lines)`);
  }
  if (script.format === "F" && !script.failureSection) {
    errors.push("F posts need failureSection");
  }
  if (script.format !== "F" && script.failureSection) {
    errors.push("failureSection is only for F posts");
  }
  const cta = script.sections.find((s) => s.id === "cta");
  if (cta && cta.voiceover !== brand.ctaLine) {
    errors.push(`CTA voiceover must be exactly "${brand.ctaLine}"`);
  }

  const total = script.sections.reduce((n, s) => n + countWords(s.voiceover), 0);
  if (total < WORD_RANGE.min || total > WORD_RANGE.max) {
    warnings.push(`Spoken words ${total} outside ${WORD_RANGE.min}-${WORD_RANGE.max} target`);
  }

  return { errors, warnings };
};
```

`video/src/templates/vo.ts`:
```ts
import { staticFile } from "remotion";
import { estimateCaptions, estimateDurationMs } from "./timing";
import type { PostScript, SectionId, VoManifest } from "./types";

export const voManifestPath = (postId: string) => `posts/${postId}/vo.json`;

export const buildEstimatedManifest = (script: PostScript, wordsPerSecond: number): VoManifest => ({
  postId: script.id,
  estimated: true,
  sections: script.sections.map((s) => {
    const durationMs = estimateDurationMs(s.voiceover, wordsPerSecond);
    return {
      id: s.id,
      text: s.voiceover,
      file: null,
      durationMs,
      captions: estimateCaptions(s.voiceover, durationMs),
    };
  }),
});

export const staleSections = (script: PostScript, vo: VoManifest): SectionId[] =>
  script.sections
    .filter((s) => vo.sections.find((v) => v.id === s.id)?.text !== s.voiceover)
    .map((s) => s.id);

// Real VO if `npm run tts` has been run for this post, otherwise estimated timing.
export const loadVo = async (script: PostScript, wordsPerSecond: number): Promise<VoManifest> => {
  let vo: VoManifest | null = null;
  try {
    const res = await fetch(staticFile(voManifestPath(script.id)));
    if (res.ok) {
      vo = (await res.json()) as VoManifest;
    }
  } catch {
    vo = null;
  }
  if (!vo) {
    return buildEstimatedManifest(script, wordsPerSecond);
  }
  const stale = staleSections(script, vo);
  if (stale.length > 0) {
    throw new Error(
      `VO for ${script.id} is out of date (${stale.join(", ")}). Run: npm run tts -- ${script.id}`,
    );
  }
  return vo;
};
```

- [ ] **Step 4: Run, verify pass**

Run: `npx vitest run src/templates`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add video/src/templates
git commit -m "feat(templates): validate scripts and load or estimate VO"
```

---

### Task 8: TTS script

**Files:**
- Create: `video/scripts/tts.ts`, `video/.env.example`

- [ ] **Step 1: Create `video/.env.example`**

```
ELEVENLABS_API_KEY=
```

- [ ] **Step 2: Implement `video/scripts/tts.ts`**

```ts
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { voice } from "../src/brand/voice";
import { alignmentToCaptions, type Alignment } from "../src/templates/alignment";
import type { PostScript, VoManifest, VoSection } from "../src/templates/types";
import { voManifestPath } from "../src/templates/vo";

type TtsResponse = { audio_base64: string; alignment: Alignment };

const synthesize = async (
  apiKey: string,
  text: string,
  previousText: string | undefined,
  nextText: string | undefined,
): Promise<TtsResponse> => {
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voice.voiceId}/with-timestamps?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: { "xi-api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        model_id: voice.modelId,
        voice_settings: voice.settings,
        // Keeps intonation natural across separately generated sections.
        previous_text: previousText,
        next_text: nextText,
      }),
    },
  );
  if (!res.ok) {
    throw new Error(`ElevenLabs ${res.status}: ${await res.text()}`);
  }
  return (await res.json()) as TtsResponse;
};

const main = async () => {
  const postId = process.argv[2];
  if (!postId) {
    throw new Error("Usage: npm run tts -- <post-id>   e.g. npm run tts -- post-02-gps");
  }
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error("ELEVENLABS_API_KEY is missing. Add it to video/.env");
  }
  if (voice.voiceId.startsWith("REPLACE")) {
    throw new Error("Set voice.voiceId in src/brand/voice.ts first");
  }

  const { script } = (await import(`../src/posts/${postId}/script`)) as { script: PostScript };
  const voDir = join(process.cwd(), "public", "posts", postId, "vo");
  mkdirSync(voDir, { recursive: true });

  const sections: VoSection[] = [];
  for (const [i, section] of script.sections.entries()) {
    console.log(`Synthesizing ${section.id}...`);
    const data = await synthesize(
      apiKey,
      section.voiceover,
      script.sections[i - 1]?.voiceover,
      script.sections[i + 1]?.voiceover,
    );
    const file = `posts/${postId}/vo/${section.id}.mp3`;
    writeFileSync(join(process.cwd(), "public", file), Buffer.from(data.audio_base64, "base64"));
    const ends = data.alignment.character_end_times_seconds;
    sections.push({
      id: section.id,
      text: section.voiceover,
      file,
      durationMs: Math.round((ends[ends.length - 1] ?? 0) * 1000),
      captions: alignmentToCaptions(data.alignment),
    });
  }

  const manifest: VoManifest = { postId, estimated: false, sections };
  writeFileSync(
    join(process.cwd(), "public", voManifestPath(postId)),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
  console.log(`Wrote ${voManifestPath(postId)}`);
};

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
```

- [ ] **Step 3: Verify it fails cleanly without config**

Run: `npm run tts -- post-02-gps`
Expected: exits 1 with "ELEVENLABS_API_KEY is missing" (or the voiceId message). It must not print any key. (`--env-file` errors if `.env` is absent; if so create an empty `video/.env` first. `.env` is already gitignored.)

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add video/scripts/tts.ts video/.env.example
git commit -m "feat(scripts): generate per-section ElevenLabs VO with captions"
```

---

### Task 9: Layout components

**Files:**
- Create: `video/src/components/Background.tsx`, `video/src/components/SafeArea.tsx`, `video/src/components/SafeZoneGuide.tsx`, `video/src/components/SceneCanvas.tsx`

- [ ] **Step 1: Implement**

`video/src/components/Background.tsx`:
```tsx
import { AbsoluteFill } from "remotion";
import { colors } from "../brand/tokens";

export const Background: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at 50% 45%, ${colors.bg.raised} 0%, ${colors.bg.base} 70%)`,
      }}
    />
  );
};
```

`video/src/components/SafeArea.tsx`:
```tsx
import { layout } from "../brand/layout";

// Positions children inside the Instagram-safe content box.
export const SafeArea: React.FC<{
  children: React.ReactNode;
  justify?: React.CSSProperties["justifyContent"];
}> = ({ children, justify = "flex-start" }) => {
  return (
    <div
      style={{
        position: "absolute",
        left: layout.content.x,
        top: layout.content.y,
        width: layout.content.width,
        height: layout.content.height,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: justify,
      }}
    >
      {children}
    </div>
  );
};
```

`video/src/components/SafeZoneGuide.tsx`:
```tsx
import { AbsoluteFill, useVideoConfig } from "remotion";
import { coverCrop, safeZone } from "../brand/layout";
import { colors, withAlpha } from "../brand/tokens";

// Dev overlay: coral = Instagram UI zones, dashed amber = 4:5 cover crop.
export const SafeZoneGuide: React.FC = () => {
  const { width, height } = useVideoConfig();
  const crop = coverCrop(width, height);
  const shade = withAlpha(colors.coral, 0.3);
  const middle = height - safeZone.top - safeZone.bottom;

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", left: 0, top: 0, width, height: safeZone.top, background: shade }} />
      <div style={{ position: "absolute", left: 0, bottom: 0, width, height: safeZone.bottom, background: shade }} />
      <div style={{ position: "absolute", left: 0, top: safeZone.top, width: safeZone.left, height: middle, background: shade }} />
      <div style={{ position: "absolute", right: 0, top: safeZone.top, width: safeZone.right, height: middle, background: shade }} />
      <div
        style={{
          position: "absolute",
          left: 0,
          top: crop.y,
          width,
          height: crop.height,
          border: `4px dashed ${colors.amber[300]}`,
          boxSizing: "border-box",
        }}
      />
    </AbsoluteFill>
  );
};
```

`video/src/components/SceneCanvas.tsx`:
```tsx
import { useVideoConfig } from "remotion";
import { layout } from "../brand/layout";

const CLIP_ID = "visual-region-clip";

// Full-frame SVG in frame coordinates (1080x1920), clipped to the visual region,
// so scene drawings can never spill into captions or Instagram UI zones.
export const SceneCanvas: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { width, height } = useVideoConfig();
  const { visual } = layout.regions;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      style={{ position: "absolute", left: 0, top: 0, width, height }}
    >
      <defs>
        <clipPath id={CLIP_ID}>
          <rect
            x={layout.content.x}
            y={visual.top}
            width={layout.content.width}
            height={visual.bottom - visual.top}
          />
        </clipPath>
      </defs>
      <g clipPath={`url(#${CLIP_ID})`}>{children}</g>
    </svg>
  );
};
```

- [ ] **Step 2: Verify**

Run: `npm run lint && npx vitest run`
Expected: pass (brand guard stays green).

- [ ] **Step 3: Commit**

```bash
git add video/src/components
git commit -m "feat(components): background, safe area, safe-zone guide, scene canvas"
```

---

### Task 10: Brand components (watermark, hook, captions, source, CTA)

**Files:**
- Create: `video/src/components/Watermark.tsx`, `HookTitle.tsx`, `Captions.tsx`, `SourceTag.tsx`, `CtaCard.tsx` (all in `video/src/components/`)

- [ ] **Step 1: Implement**

`video/src/components/Watermark.tsx`:
```tsx
import { Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { layout } from "../brand/layout";
import { clamp, durations, ease } from "../brand/motion";

// Doubles as the logo sting: pops in within the first second, fades out at the end
// of its Sequence.
export const Watermark: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  return (
    <Img
      name="Watermark"
      src={staticFile("brand/avatar.svg")}
      style={{
        position: "absolute",
        left: layout.watermark.x,
        top: layout.watermark.y,
        width: layout.watermark.width,
        scale: interpolate(frame, [0, durations.sting], [0, 1], { ...clamp, easing: ease.pop }),
        opacity: interpolate(
          frame,
          [durationInFrames - durations.transition, durationInFrames],
          [0.9, 0],
          clamp,
        ),
      }}
    />
  );
};
```

`video/src/components/HookTitle.tsx`:
```tsx
import { Interactive, interpolate, useCurrentFrame } from "remotion";
import { fonts, weights } from "../brand/fonts";
import { layout } from "../brand/layout";
import { clamp, durations, ease } from "../brand/motion";
import { colors, typeScale } from "../brand/tokens";

const bare = (word: string) => word.toLowerCase().replace(/[^a-z0-9']/g, "");

// Visible from frame 0 (no fade-in): only a subtle settle.
export const HookTitle: React.FC<{ text: string; highlight?: string }> = ({ text, highlight }) => {
  const frame = useCurrentFrame();
  const words = text.split(" ");

  return (
    <Interactive.Div
      name="Hook title"
      style={{
        position: "absolute",
        left: layout.content.x,
        top: layout.regions.visual.top,
        width: layout.content.width,
        textAlign: "center",
        fontFamily: fonts.heading,
        fontWeight: weights.heading,
        fontSize: typeScale.hook,
        lineHeight: 1.1,
        color: colors.text.primary,
        scale: interpolate(frame, [0, durations.enter], [0.94, 1], { ...clamp, easing: ease.out }),
      }}
    >
      {words.map((word, i) => (
        <span
          key={`${word}-${i}`}
          style={{
            color:
              highlight && bare(word) === bare(highlight) ? colors.amber[500] : colors.text.primary,
          }}
        >
          {i < words.length - 1 ? `${word} ` : word}
        </span>
      ))}
    </Interactive.Div>
  );
};
```

`video/src/components/Captions.tsx`:
```tsx
import { createTikTokStyleCaptions, type Caption, type TikTokPage } from "@remotion/captions";
import { useMemo } from "react";
import { AbsoluteFill, Sequence, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { fonts, weights } from "../brand/fonts";
import { layout } from "../brand/layout";
import { clamp } from "../brand/motion";
import { colors, typeScale, withAlpha } from "../brand/tokens";

// Higher = more words per page. ~1.2 s keeps pages to 1-2 lines.
const SWITCH_CAPTIONS_EVERY_MS = 1200;

const CaptionPage: React.FC<{ page: TikTokPage }> = ({ page }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const absoluteTimeMs = page.startMs + (frame / fps) * 1000;
  const { captions } = layout.regions;

  return (
    <div
      style={{
        position: "absolute",
        left: layout.content.x,
        top: captions.top,
        width: layout.content.width,
        height: captions.bottom - captions.top,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        whiteSpace: "pre-wrap",
        fontFamily: fonts.body,
        fontWeight: weights.bodySemibold,
        fontSize: typeScale.caption,
        lineHeight: 1.2,
        textShadow: `0 4px 24px ${withAlpha(colors.bg.base, 0.9)}`,
        translate: interpolate(frame, [0, 4], ["0px 12px", "0px 0px"], clamp),
      }}
    >
      <span>
        {page.tokens.map((token, i) => {
          const active = token.fromMs <= absoluteTimeMs && token.toMs > absoluteTimeMs;
          return (
            <span
              key={`${token.fromMs}-${i}`}
              style={{ color: active ? colors.amber[500] : colors.text.primary }}
            >
              {token.text}
            </span>
          );
        })}
      </span>
    </div>
  );
};

export const Captions: React.FC<{ captions: Caption[] }> = ({ captions }) => {
  const { fps } = useVideoConfig();
  const { pages } = useMemo(
    () =>
      createTikTokStyleCaptions({
        captions,
        combineTokensWithinMilliseconds: SWITCH_CAPTIONS_EVERY_MS,
      }),
    [captions],
  );

  return (
    <AbsoluteFill>
      {pages.map((page, i) => {
        const next = pages[i + 1] ?? null;
        const from = Math.round((page.startMs / 1000) * fps);
        const endMs = Math.min(
          next ? next.startMs : Infinity,
          page.startMs + SWITCH_CAPTIONS_EVERY_MS,
        );
        const durationInFrames = Math.round((endMs / 1000) * fps) - from;
        if (durationInFrames <= 0) {
          return null;
        }
        return (
          <Sequence key={`${page.startMs}-${i}`} from={from} durationInFrames={durationInFrames}>
            <CaptionPage page={page} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
```

`video/src/components/SourceTag.tsx`:
```tsx
import { Interactive, interpolate, useCurrentFrame } from "remotion";
import { fonts, weights } from "../brand/fonts";
import { layout } from "../brand/layout";
import { clamp, durations } from "../brand/motion";
import { colors, typeScale } from "../brand/tokens";

export const SourceTag: React.FC<{ source: string }> = ({ source }) => {
  const frame = useCurrentFrame();
  const { source: region } = layout.regions;

  return (
    <Interactive.Div
      name="Source"
      style={{
        position: "absolute",
        left: layout.content.x,
        top: region.top,
        width: layout.content.width,
        height: region.bottom - region.top,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: fonts.body,
        fontWeight: weights.bodyMedium,
        fontSize: typeScale.source,
        color: colors.text.muted,
        opacity: interpolate(frame, [0, durations.enter], [0, 1], clamp),
      }}
    >
      {`Source: ${source}`}
    </Interactive.Div>
  );
};
```

`video/src/components/CtaCard.tsx`:
```tsx
import { Img, Interactive, interpolate, staticFile, useCurrentFrame } from "remotion";
import { fonts, weights } from "../brand/fonts";
import { clamp, durations, ease } from "../brand/motion";
import { brand, colors, typeScale } from "../brand/tokens";
import { SafeArea } from "./SafeArea";

// Stacked logo already contains the wordmark and tagline.
export const CtaCard: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <SafeArea justify="center">
      <Img
        name="CTA logo"
        src={staticFile("brand/stacked.svg")}
        style={{
          width: 760,
          opacity: interpolate(frame, [0, durations.enter], [0, 1], clamp),
          scale: interpolate(frame, [0, durations.enter * 1.5], [0.9, 1], {
            ...clamp,
            easing: ease.pop,
          }),
        }}
      />
      <Interactive.Div
        name="CTA handle"
        style={{
          marginTop: -40,
          fontFamily: fonts.body,
          fontWeight: weights.bodySemibold,
          fontSize: typeScale.label,
          color: colors.teal[400],
          opacity: interpolate(frame, [durations.enter, durations.enter * 2], [0, 1], clamp),
        }}
      >
        {brand.handle}
      </Interactive.Div>
    </SafeArea>
  );
};
```

- [ ] **Step 2: Verify**

Run: `npm run lint && npx vitest run`
Expected: pass. If ESLint flags a Remotion rule, fix the code rather than disabling the rule.

- [ ] **Step 3: Commit**

```bash
git add video/src/components
git commit -m "feat(components): watermark, hook title, captions, source tag, CTA card"
```

---

### Task 11: Explainer components and icons

**Files:**
- Create: `video/src/components/StepBadge.tsx`, `Stamp.tsx`, `FailureBadge.tsx`
- Create: `video/src/components/icons/{PhoneIcon,SatelliteIcon,EarthIcon,ClockIcon,PinIcon,PlaneIcon}.tsx`

Icons are SVG `<g>` elements used inside `SceneCanvas`: drawn in a 100-unit box centered on (0,0), placed with `x`, `y`, `size` (rendered width in px).

- [ ] **Step 1: Implement components**

`video/src/components/StepBadge.tsx`:
```tsx
import { Interactive, interpolate, useCurrentFrame } from "remotion";
import { fonts, weights } from "../brand/fonts";
import { clamp, durations, ease } from "../brand/motion";
import { colors, typeScale } from "../brand/tokens";

// Animates in at local frame 0. Wrap in a <Sequence from={cue}>.
export const StepBadge: React.FC<{ n: number; label: string }> = ({ n, label }) => {
  const frame = useCurrentFrame();

  return (
    <Interactive.Div
      name="Step badge"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 24,
        opacity: interpolate(frame, [0, durations.enter], [0, 1], clamp),
        translate: interpolate(frame, [0, durations.enter], ["0px 24px", "0px 0px"], {
          ...clamp,
          easing: ease.out,
        }),
      }}
    >
      <div
        style={{
          width: 88,
          height: 88,
          flexShrink: 0,
          borderRadius: 44,
          background: colors.teal[400],
          color: colors.bg.base,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: fonts.heading,
          fontWeight: weights.heading,
          fontSize: typeScale.label,
        }}
      >
        {n}
      </div>
      <div
        style={{
          fontFamily: fonts.body,
          fontWeight: weights.bodyMedium,
          fontSize: typeScale.label,
          color: colors.text.primary,
        }}
      >
        {label}
      </div>
    </Interactive.Div>
  );
};
```

`video/src/components/Stamp.tsx`:
```tsx
import { Interactive, interpolate, useCurrentFrame } from "remotion";
import { fonts, weights } from "../brand/fonts";
import { clamp, durations, ease } from "../brand/motion";
import { colors, typeScale } from "../brand/tokens";

// Q posts: MYTH (coral) and FACT (teal). Wrap in a <Sequence from={cue}>.
export const Stamp: React.FC<{ kind: "myth" | "fact" }> = ({ kind }) => {
  const frame = useCurrentFrame();
  const color = kind === "myth" ? colors.coral : colors.teal[400];

  return (
    <Interactive.Div
      name="Stamp"
      style={{
        display: "inline-block",
        padding: "12px 40px",
        border: `8px solid ${color}`,
        borderRadius: 16,
        color,
        fontFamily: fonts.heading,
        fontWeight: weights.heading,
        fontSize: typeScale.title,
        letterSpacing: 6,
        rotate: "-8deg",
        opacity: interpolate(frame, [0, 4], [0, 1], clamp),
        scale: interpolate(frame, [0, durations.enter], [1.6, 1], { ...clamp, easing: ease.pop }),
      }}
    >
      {kind === "myth" ? "MYTH" : "FACT"}
    </Interactive.Div>
  );
};
```

`video/src/components/FailureBadge.tsx`:
```tsx
import { Interactive, interpolate, useCurrentFrame } from "remotion";
import { fonts, weights } from "../brand/fonts";
import { layout } from "../brand/layout";
import { clamp, durations, ease } from "../brand/motion";
import { colors, typeScale } from "../brand/tokens";

// F posts: rendered by the Reel template over the failure section.
export const FailureBadge: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <div
      style={{
        position: "absolute",
        left: layout.content.x,
        top: layout.regions.visual.top,
        width: layout.content.width,
        display: "flex",
        justifyContent: "center",
      }}
    >
      <Interactive.Div
        name="Failure badge"
        style={{
          padding: "10px 32px",
          borderRadius: 999,
          background: colors.coral,
          color: colors.bg.base,
          fontFamily: fonts.heading,
          fontWeight: weights.heading,
          fontSize: typeScale.label,
          letterSpacing: 2,
          scale: interpolate(frame, [0, durations.enter], [0.6, 1], { ...clamp, easing: ease.pop }),
        }}
      >
        WHEN IT FAILED
      </Interactive.Div>
    </div>
  );
};
```

- [ ] **Step 2: Implement icons**

`video/src/components/icons/PhoneIcon.tsx`:
```tsx
import { colors } from "../../brand/tokens";

export const PhoneIcon: React.FC<{ x: number; y: number; size: number }> = ({ x, y, size }) => {
  return (
    <g transform={`translate(${x} ${y}) scale(${size / 100})`}>
      <rect x={-28} y={-50} width={56} height={100} rx={10} fill={colors.bg.raised} stroke={colors.teal[400]} strokeWidth={4} />
      <rect x={-22} y={-40} width={44} height={76} rx={4} fill={colors.bg.base} />
      <line x1={-8} y1={43} x2={8} y2={43} stroke={colors.teal[400]} strokeWidth={3} strokeLinecap="round" />
    </g>
  );
};
```

`video/src/components/icons/SatelliteIcon.tsx`:
```tsx
import { colors } from "../../brand/tokens";

export const SatelliteIcon: React.FC<{ x: number; y: number; size: number }> = ({ x, y, size }) => {
  return (
    <g transform={`translate(${x} ${y}) scale(${size / 100})`}>
      <rect x={-48} y={-8} width={30} height={16} fill={colors.teal[600]} stroke={colors.teal[300]} strokeWidth={2} />
      <rect x={18} y={-8} width={30} height={16} fill={colors.teal[600]} stroke={colors.teal[300]} strokeWidth={2} />
      <rect x={-12} y={-12} width={24} height={24} rx={3} fill={colors.amber[500]} />
      <line x1={0} y1={12} x2={0} y2={24} stroke={colors.amber[300]} strokeWidth={3} />
      <circle cx={0} cy={27} r={4} fill={colors.amber[300]} />
    </g>
  );
};
```

`video/src/components/icons/EarthIcon.tsx`:
```tsx
import { colors } from "../../brand/tokens";

export const EarthIcon: React.FC<{ x: number; y: number; size: number }> = ({ x, y, size }) => {
  return (
    <g transform={`translate(${x} ${y}) scale(${size / 100})`}>
      <circle r={48} fill={colors.teal[700]} stroke={colors.teal[400]} strokeWidth={2} />
      <ellipse rx={20} ry={48} fill="none" stroke={colors.teal[600]} strokeWidth={1.5} />
      <line x1={-48} y1={0} x2={48} y2={0} stroke={colors.teal[600]} strokeWidth={1.5} />
      <path d="M-30 -22 C-18 -30 -6 -26 -4 -14 C-2 -4 -16 0 -24 -6 C-32 -10 -36 -16 -30 -22 Z" fill={colors.teal[600]} />
      <path d="M8 6 C20 2 32 8 30 20 C28 32 14 34 8 24 C4 18 2 10 8 6 Z" fill={colors.teal[600]} />
    </g>
  );
};
```

`video/src/components/icons/ClockIcon.tsx`:
```tsx
import { colors } from "../../brand/tokens";

// minuteAngle in degrees, 0 = 12 o'clock.
export const ClockIcon: React.FC<{ x: number; y: number; size: number; minuteAngle: number }> = ({
  x,
  y,
  size,
  minuteAngle,
}) => {
  return (
    <g transform={`translate(${x} ${y}) scale(${size / 100})`}>
      <circle r={44} fill={colors.bg.raised} stroke={colors.amber[500]} strokeWidth={5} />
      {[0, 90, 180, 270].map((a) => (
        <line key={a} x1={0} y1={-36} x2={0} y2={-30} stroke={colors.text.secondary} strokeWidth={3} transform={`rotate(${a})`} />
      ))}
      <line x1={0} y1={0} x2={0} y2={-18} stroke={colors.text.primary} strokeWidth={5} strokeLinecap="round" transform="rotate(120)" />
      <line x1={0} y1={0} x2={0} y2={-30} stroke={colors.amber[300]} strokeWidth={4} strokeLinecap="round" transform={`rotate(${minuteAngle})`} />
      <circle r={4} fill={colors.text.primary} />
    </g>
  );
};
```

`video/src/components/icons/PinIcon.tsx`:
```tsx
import { colors } from "../../brand/tokens";

// The pin's tip sits at (x, y).
export const PinIcon: React.FC<{ x: number; y: number; size: number }> = ({ x, y, size }) => {
  return (
    <g transform={`translate(${x} ${y}) scale(${size / 100}) translate(0 -48)`}>
      <path d="M0 48 C-4 30 -32 10 -32 -14 A32 32 0 1 1 32 -14 C32 10 4 30 0 48 Z" fill={colors.amber[500]} />
      <circle cx={0} cy={-14} r={12} fill={colors.bg.base} />
    </g>
  );
};
```

`video/src/components/icons/PlaneIcon.tsx`:
```tsx
import { colors } from "../../brand/tokens";

export const PlaneIcon: React.FC<{ x: number; y: number; size: number }> = ({ x, y, size }) => {
  return (
    <g transform={`translate(${x} ${y}) scale(${size / 100})`}>
      <path
        d="M-6 -46 L6 -46 L8 -10 L46 12 L46 22 L8 10 L6 34 L18 42 L18 48 L0 44 L-18 48 L-18 42 L-6 34 L-8 10 L-46 22 L-46 12 L-8 -10 Z"
        fill={colors.teal[400]}
      />
    </g>
  );
};
```

- [ ] **Step 3: Verify**

Run: `npm run lint && npx vitest run`
Expected: pass.

- [ ] **Step 4: Commit**

```bash
git add video/src/components
git commit -m "feat(components): step badge, stamps, failure badge, base icons"
```

---

### Task 12: Section context and Reel template

**Files:**
- Create: `video/src/templates/SectionContext.tsx`, `video/src/templates/Reel.tsx`, `video/src/templates/metadata.ts`

- [ ] **Step 1: Implement `SectionContext.tsx`**

```tsx
import type { Caption } from "@remotion/captions";
import { createContext, useContext } from "react";
import { useVideoConfig } from "remotion";
import { findCueMs } from "./cues";

type Section = { captions: Caption[]; durationInFrames: number };

export const SectionContext = createContext<Section | null>(null);

export const useSection = (): Section => {
  const section = useContext(SectionContext);
  if (!section) {
    throw new Error("useSection must be used inside a Reel section");
  }
  return section;
};

// Local frame at which `word` is spoken in this section. Falls back to a fraction
// of the section length if the word isn't found (e.g. after a script edit).
export const useCue = (word: string, fallbackFraction: number): number => {
  const { captions, durationInFrames } = useSection();
  const { fps } = useVideoConfig();
  const ms = findCueMs(captions, word);
  return ms === null
    ? Math.round(durationInFrames * fallbackFraction)
    : Math.round((ms / 1000) * fps);
};
```

- [ ] **Step 2: Implement `Reel.tsx`**

```tsx
import { Audio } from "@remotion/media";
import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { AbsoluteFill, Sequence, staticFile, useVideoConfig } from "remotion";
import { durations } from "../brand/motion";
import { audioMix, brand } from "../brand/tokens";
import { Background } from "../components/Background";
import { Captions } from "../components/Captions";
import { CtaCard } from "../components/CtaCard";
import { FailureBadge } from "../components/FailureBadge";
import { HookTitle } from "../components/HookTitle";
import { SafeZoneGuide } from "../components/SafeZoneGuide";
import { SourceTag } from "../components/SourceTag";
import { Watermark } from "../components/Watermark";
import { SectionContext } from "./SectionContext";
import { computeTimeline, mergeCaptions, SOURCE_LEAD_SECONDS } from "./timing";
import type { PostScript, SectionId, VoManifest } from "./types";

export type ReelProps = {
  script: PostScript;
  // Filled in by calculateReelMetadata.
  vo: VoManifest | null;
  // Studio-only overlay of Instagram UI zones and the 4:5 cover crop.
  showGuides: boolean;
};

// Bespoke scenes per post. The CTA is always the shared CtaCard.
export type SceneMap = Record<Exclude<SectionId, "cta">, React.FC>;

export const Reel: React.FC<ReelProps & { scenes: SceneMap }> = ({
  script,
  vo,
  showGuides,
  scenes,
}) => {
  const { fps } = useVideoConfig();
  if (!vo) {
    throw new Error("VO manifest missing: calculateReelMetadata should have provided it");
  }

  const { sections } = computeTimeline(vo.sections, fps, durations.transition);
  const captions = mergeCaptions(vo.sections, sections, fps);
  const timing = (id: SectionId) => {
    const t = sections.find((s) => s.id === id);
    if (!t) {
      throw new Error(`Missing section ${id}`);
    }
    return t;
  };
  const cta = timing("cta");
  const sourceFrom = Math.max(0, cta.from - SOURCE_LEAD_SECONDS * fps);

  return (
    <AbsoluteFill>
      <Background />
      <TransitionSeries>
        {vo.sections.flatMap((section, i) => {
          const t = timing(section.id);
          const Scene = section.id === "cta" ? CtaCard : scenes[section.id];
          return [
            i > 0 ? (
              <TransitionSeries.Transition
                key={`${section.id}-transition`}
                presentation={fade()}
                timing={linearTiming({ durationInFrames: durations.transition })}
              />
            ) : null,
            <TransitionSeries.Sequence
              key={section.id}
              name={section.id}
              durationInFrames={t.durationInFrames}
            >
              <SectionContext.Provider
                value={{ captions: section.captions, durationInFrames: t.durationInFrames }}
              >
                <Scene />
                {section.id === "hook" ? (
                  <HookTitle text={script.hookText} highlight={script.hookHighlight} />
                ) : null}
                {section.id === script.failureSection ? <FailureBadge /> : null}
              </SectionContext.Provider>
              {section.file ? <Audio src={staticFile(section.file)} /> : null}
            </TransitionSeries.Sequence>,
          ];
        })}
      </TransitionSeries>
      <Sequence name="Watermark" durationInFrames={cta.from + durations.transition}>
        <Watermark />
      </Sequence>
      <Sequence name="Captions" durationInFrames={cta.from}>
        <Captions captions={captions} />
      </Sequence>
      <Sequence name="Source" from={sourceFrom}>
        <SourceTag source={script.source} />
      </Sequence>
      {brand.music ? (
        <Audio src={staticFile(brand.music)} volume={audioMix.musicVolume} loop />
      ) : null}
      {showGuides ? <SafeZoneGuide /> : null}
    </AbsoluteFill>
  );
};
```

- [ ] **Step 3: Implement `metadata.ts`**

```ts
import type { CalculateMetadataFunction } from "remotion";
import { durations } from "../brand/motion";
import { video } from "../brand/tokens";
import { voice } from "../brand/voice";
import type { ReelProps } from "./Reel";
import { computeTimeline } from "./timing";
import { validateScript } from "./validate";
import { loadVo } from "./vo";

export const calculateReelMetadata: CalculateMetadataFunction<ReelProps> = async ({ props }) => {
  const { errors, warnings } = validateScript(props.script);
  if (errors.length > 0) {
    throw new Error(`Script ${props.script.id} is invalid:\n- ${errors.join("\n- ")}`);
  }
  warnings.forEach((w) => console.warn(`[${props.script.id}] ${w}`));

  const vo = await loadVo(props.script, voice.wordsPerSecond);
  if (vo.estimated) {
    console.warn(`[${props.script.id}] Using estimated timing. Run: npm run tts -- ${props.script.id}`);
  }
  const { totalFrames } = computeTimeline(vo.sections, video.fps, durations.transition);
  return { durationInFrames: totalFrames, props: { ...props, vo } };
};
```

- [ ] **Step 4: Verify**

Run: `npm run lint && npx vitest run`
Expected: pass. If `TransitionSeries` rejects `null` children, filter them: `.flatMap(...).filter(Boolean)`.

- [ ] **Step 5: Commit**

```bash
git add video/src/templates
git commit -m "feat(templates): Reel template with transitions, captions, watermark, source"
```

---

### Task 13: Post 2 script and scenes

**Files:**
- Create: `video/src/posts/post-02-gps/script.ts`, `index.tsx`, `scenes/HookScene.tsx`, `scenes/SetupScene.tsx`, `scenes/MechanismScene.tsx`, `scenes/PayoffScene.tsx`
- Test: `video/src/posts/post-02-gps/script.test.ts`

VO text is verbatim from `Posts/post_2/script.md`, except the CTA, which uses the new canonical line (approved tagline change).

- [ ] **Step 1: Write the failing test**

`video/src/posts/post-02-gps/script.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { validateScript } from "../../templates/validate";
import { script } from "./script";

describe("post 02 script", () => {
  it("passes validation with no warnings", () => {
    expect(validateScript(script)).toEqual({ errors: [], warnings: [] });
  });
});
```

Run: `npx vitest run src/posts` → Expected: FAIL, `./script` not found.

- [ ] **Step 2: Create `script.ts`**

```ts
import type { PostScript } from "../../templates/types";

export const script: PostScript = {
  id: "post-02-gps",
  postNumber: 2,
  format: "E",
  title: "How GPS finds you",
  hookText: "GPS doesn't track you",
  hookHighlight: "track",
  source: "GPS.gov",
  verify: [
    "Satellite count (about 30 operational)",
    "Relativity drift figure (commonly cited ~10 km / 6 mi per day)",
  ],
  sections: [
    {
      id: "hook",
      voiceover: "GPS doesn't track you. Your phone just listens.",
      visual: "Phone icon with ears/sound waves; satellite beams arrive, nothing goes back.",
    },
    {
      id: "setup",
      voiceover:
        "About thirty satellites circle the Earth, and all they do is broadcast the time.",
      visual: "Orbit animation, satellites emitting expanding rings.",
    },
    {
      id: "mechanism",
      voiceover:
        "Each signal carries the satellite's position and the exact moment it was sent. Your phone measures how late each signal arrives. Delay times the speed of light gives distance. Three distances pin down your position. A fourth fixes your phone's clock.",
      visual:
        "Circles from 3 satellites overlap at one point; a 4th circle snaps in and a small clock icon corrects itself.",
    },
    {
      id: "payoff",
      voiceover:
        "Your phone never sends anything back, so GPS works with no internet. And the satellites' clocks are corrected for relativity. Skip that, and you'd drift by several kilometers every day.",
      visual:
        "Phone shows airplane mode and still has a location pin. Clock with a tiny correction arrow.",
    },
    {
      id: "cta",
      voiceover: "Follow Unpack and Explain for how things actually work.",
      visual: "Logo + tagline card.",
    },
  ],
};
```

Run: `npx vitest run src/posts` → Expected: PASS (102 words, within 90-110).

- [ ] **Step 3: Create `scenes/HookScene.tsx`**

```tsx
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { clamp, durations, ease } from "../../../brand/motion";
import { colors } from "../../../brand/tokens";
import { PhoneIcon } from "../../../components/icons/PhoneIcon";
import { SatelliteIcon } from "../../../components/icons/SatelliteIcon";
import { SceneCanvas } from "../../../components/SceneCanvas";

const PHONE = { x: 540, y: 930 };
const SATELLITES = [
  { x: 230, y: 700 },
  { x: 850, y: 690 },
];
const RING_PERIOD = 36;

// Hook title is added by the Reel template above this scene.
export const HookScene: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill>
      <SceneCanvas>
        {SATELLITES.map((sat, i) =>
          [0, 1, 2].map((k) => {
            const t = ((frame + k * (RING_PERIOD / 3) + i * 6) % RING_PERIOD) / RING_PERIOD;
            return (
              <circle
                key={`${i}-${k}`}
                cx={sat.x}
                cy={sat.y}
                r={40 + t * 320}
                fill="none"
                stroke={colors.teal[300]}
                strokeWidth={4}
                opacity={(1 - t) * 0.6}
              />
            );
          }),
        )}
        {SATELLITES.map((sat) => (
          <SatelliteIcon key={sat.x} x={sat.x} y={sat.y} size={110} />
        ))}
        <g
          style={{
            scale: interpolate(frame, [0, durations.enter], [0.8, 1], { ...clamp, easing: ease.smooth }),
            transformOrigin: `${PHONE.x}px ${PHONE.y}px`,
          }}
        >
          <PhoneIcon x={PHONE.x} y={PHONE.y} size={260} />
        </g>
      </SceneCanvas>
    </AbsoluteFill>
  );
};
```

- [ ] **Step 4: Create `scenes/SetupScene.tsx`**

```tsx
import { AbsoluteFill, Interactive, interpolate, useCurrentFrame } from "remotion";
import { fonts, weights } from "../../../brand/fonts";
import { layout } from "../../../brand/layout";
import { clamp, durations } from "../../../brand/motion";
import { colors, typeScale } from "../../../brand/tokens";
import { EarthIcon } from "../../../components/icons/EarthIcon";
import { SatelliteIcon } from "../../../components/icons/SatelliteIcon";
import { SceneCanvas } from "../../../components/SceneCanvas";
import { useCue } from "../../../templates/SectionContext";

const EARTH = { x: 540, y: 790 };
const ORBITS = [
  { rx: 330, ry: 100, tilt: -18, speed: 0.012, phase: 0 },
  { rx: 300, ry: 120, tilt: 24, speed: 0.016, phase: 2.1 },
  { rx: 340, ry: 80, tilt: 70, speed: 0.01, phase: 4.2 },
];
const RING_PERIOD = 40;

const orbitPoint = (orbit: (typeof ORBITS)[number], frame: number) => {
  const a = orbit.phase + frame * orbit.speed;
  const t = (orbit.tilt * Math.PI) / 180;
  const px = orbit.rx * Math.cos(a);
  const py = orbit.ry * Math.sin(a);
  return {
    x: EARTH.x + px * Math.cos(t) - py * Math.sin(t),
    y: EARTH.y + px * Math.sin(t) + py * Math.cos(t),
  };
};

export const SetupScene: React.FC = () => {
  const frame = useCurrentFrame();
  const broadcast = useCue("broadcast", 0.6);

  return (
    <AbsoluteFill>
      <SceneCanvas>
        <EarthIcon x={EARTH.x} y={EARTH.y} size={240} />
        {ORBITS.map((orbit) => {
          const p = orbitPoint(orbit, frame);
          const t = ((frame + orbit.phase * 10) % RING_PERIOD) / RING_PERIOD;
          return (
            <g key={orbit.tilt}>
              <ellipse
                cx={EARTH.x}
                cy={EARTH.y}
                rx={orbit.rx}
                ry={orbit.ry}
                transform={`rotate(${orbit.tilt} ${EARTH.x} ${EARTH.y})`}
                fill="none"
                stroke={colors.teal[600]}
                strokeWidth={3}
                strokeDasharray="6 10"
              />
              <circle
                cx={p.x}
                cy={p.y}
                r={20 + t * 90}
                fill="none"
                stroke={colors.teal[300]}
                strokeWidth={3}
                opacity={(1 - t) * 0.7}
              />
              <SatelliteIcon x={p.x} y={p.y} size={80} />
            </g>
          );
        })}
      </SceneCanvas>
      <Interactive.Div
        name="Satellite count"
        style={{
          position: "absolute",
          left: layout.content.x,
          top: 390,
          width: layout.content.width,
          textAlign: "center",
          fontFamily: fonts.heading,
          fontWeight: weights.heading,
          fontSize: typeScale.title,
          color: colors.text.primary,
          opacity: interpolate(frame, [0, durations.enter], [0, 1], clamp),
        }}
      >
        <span style={{ color: colors.amber[500] }}>~30</span> satellites
      </Interactive.Div>
      <Interactive.Div
        name="Broadcast label"
        style={{
          position: "absolute",
          left: layout.content.x,
          top: 1070,
          width: layout.content.width,
          textAlign: "center",
          fontFamily: fonts.body,
          fontWeight: weights.bodyMedium,
          fontSize: typeScale.label,
          color: colors.text.secondary,
          opacity: interpolate(frame, [broadcast, broadcast + durations.enter], [0, 1], clamp),
        }}
      >
        All they send is the time
      </Interactive.Div>
    </AbsoluteFill>
  );
};
```

- [ ] **Step 5: Create `scenes/MechanismScene.tsx`**

```tsx
import { AbsoluteFill, interpolate, Sequence, useCurrentFrame } from "remotion";
import { layout } from "../../../brand/layout";
import { clamp, ease } from "../../../brand/motion";
import { colors } from "../../../brand/tokens";
import { ClockIcon } from "../../../components/icons/ClockIcon";
import { PhoneIcon } from "../../../components/icons/PhoneIcon";
import { PinIcon } from "../../../components/icons/PinIcon";
import { SatelliteIcon } from "../../../components/icons/SatelliteIcon";
import { SceneCanvas } from "../../../components/SceneCanvas";
import { StepBadge } from "../../../components/StepBadge";
import { useCue, useSection } from "../../../templates/SectionContext";

const PHONE = { x: 540, y: 880 };
const SATELLITES = [
  { x: 210, y: 470 },
  { x: 540, y: 430 },
  { x: 870, y: 480 },
];
const FOURTH = { x: 860, y: 1070 };
const DRAW_FRAMES = 20;
const PULSE_PERIOD = 30;

const distance = (a: { x: number; y: number }) => Math.hypot(a.x - PHONE.x, a.y - PHONE.y);

const DrawCircle: React.FC<{ center: { x: number; y: number }; start: number; color: string }> = ({
  center,
  start,
  color,
}) => {
  const frame = useCurrentFrame();
  const r = distance(center);
  const circumference = 2 * Math.PI * r;
  return (
    <circle
      cx={center.x}
      cy={center.y}
      r={r}
      fill="none"
      stroke={color}
      strokeWidth={5}
      strokeDasharray={circumference}
      strokeDashoffset={interpolate(frame, [start, start + DRAW_FRAMES], [circumference, 0], {
        ...clamp,
        easing: ease.smooth,
      })}
    />
  );
};

export const MechanismScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useSection();
  const steps = [
    { n: 1, label: "Position + send time", from: useCue("carries", 0) },
    { n: 2, label: "Measure the delay", from: useCue("measures", 0.25) },
    { n: 3, label: "Delay × light speed = distance", from: useCue("delay", 0.45) },
    { n: 4, label: "3 distances = your position", from: useCue("three", 0.65) },
    { n: 5, label: "A 4th fixes the clock", from: useCue("fourth", 0.85) },
  ];
  const [pulses, , distances, circles, fourth] = steps.map((s) => s.from);

  return (
    <AbsoluteFill>
      <SceneCanvas>
        {SATELLITES.map((sat) => (
          <line
            key={`line-${sat.x}`}
            x1={sat.x}
            y1={sat.y}
            x2={PHONE.x}
            y2={PHONE.y}
            stroke={frame >= distances ? colors.amber[500] : colors.teal[600]}
            strokeWidth={frame >= distances ? 6 : 3}
            strokeDasharray={frame >= distances ? undefined : "8 10"}
            opacity={interpolate(frame, [pulses, pulses + 10], [0, 1], clamp)}
          />
        ))}
        {frame >= pulses && frame < distances
          ? SATELLITES.map((sat, i) => {
              const t = ((frame - pulses + i * 8) % PULSE_PERIOD) / PULSE_PERIOD;
              return (
                <circle
                  key={`pulse-${sat.x}`}
                  cx={sat.x + (PHONE.x - sat.x) * t}
                  cy={sat.y + (PHONE.y - sat.y) * t}
                  r={10}
                  fill={colors.teal[300]}
                />
              );
            })
          : null}
        {SATELLITES.map((sat) => (
          <DrawCircle key={`circle-${sat.x}`} center={sat} start={circles} color={colors.teal[400]} />
        ))}
        {frame >= fourth ? (
          <DrawCircle center={FOURTH} start={fourth + 8} color={colors.amber[300]} />
        ) : null}
        {SATELLITES.map((sat) => (
          <SatelliteIcon key={`sat-${sat.x}`} x={sat.x} y={sat.y} size={100} />
        ))}
        {frame >= fourth ? <SatelliteIcon x={FOURTH.x} y={FOURTH.y} size={90} /> : null}
        <PhoneIcon x={PHONE.x} y={PHONE.y} size={140} />
        <g
          style={{
            scale: interpolate(frame, [circles + DRAW_FRAMES, circles + DRAW_FRAMES + 12], [0, 1], {
              ...clamp,
              easing: ease.pop,
            }),
            transformOrigin: `${PHONE.x}px ${PHONE.y - 80}px`,
          }}
        >
          <PinIcon x={PHONE.x} y={PHONE.y - 80} size={80} />
        </g>
        {frame >= fourth ? (
          <ClockIcon
            x={PHONE.x + 150}
            y={PHONE.y}
            size={90}
            minuteAngle={interpolate(frame, [fourth + 15, fourth + 30], [60, 0], {
              ...clamp,
              easing: ease.pop,
            })}
          />
        ) : null}
      </SceneCanvas>
      {steps.map((step, i) => {
        const end = steps[i + 1]?.from ?? durationInFrames;
        return end > step.from ? (
          <Sequence key={step.n} from={step.from} durationInFrames={end - step.from} layout="none">
            <div style={{ position: "absolute", left: layout.content.x, top: 1050 }}>
              <StepBadge n={step.n} label={step.label} />
            </div>
          </Sequence>
        ) : null;
      })}
    </AbsoluteFill>
  );
};
```

- [ ] **Step 6: Create `scenes/PayoffScene.tsx`**

```tsx
import { AbsoluteFill, Interactive, interpolate, useCurrentFrame } from "remotion";
import { fonts, weights } from "../../../brand/fonts";
import { layout } from "../../../brand/layout";
import { clamp, ease } from "../../../brand/motion";
import { colors, typeScale } from "../../../brand/tokens";
import { ClockIcon } from "../../../components/icons/ClockIcon";
import { PhoneIcon } from "../../../components/icons/PhoneIcon";
import { PinIcon } from "../../../components/icons/PinIcon";
import { PlaneIcon } from "../../../components/icons/PlaneIcon";
import { SceneCanvas } from "../../../components/SceneCanvas";
import { useCue } from "../../../templates/SectionContext";

const CENTER = { x: 540, y: 760 };
const SWAP_FRAMES = 8;

export const PayoffScene: React.FC = () => {
  const frame = useCurrentFrame();
  const beat2 = useCue("relativity", 0.5);
  const beat1Opacity = interpolate(frame, [beat2 - SWAP_FRAMES, beat2], [1, 0], clamp);
  const beat2Opacity = interpolate(frame, [beat2, beat2 + SWAP_FRAMES], [0, 1], clamp);

  return (
    <AbsoluteFill>
      <SceneCanvas>
        <g opacity={beat1Opacity}>
          <PhoneIcon x={CENTER.x} y={CENTER.y} size={320} />
          <PlaneIcon x={CENTER.x} y={CENTER.y - 90} size={60} />
          <g
            style={{
              scale: interpolate(frame, [10, 22], [0, 1], { ...clamp, easing: ease.pop }),
              transformOrigin: `${CENTER.x}px ${CENTER.y + 50}px`,
            }}
          >
            <PinIcon x={CENTER.x} y={CENTER.y + 50} size={90} />
          </g>
        </g>
        <g opacity={beat2Opacity}>
          <ClockIcon
            x={CENTER.x}
            y={CENTER.y}
            size={300}
            minuteAngle={interpolate(frame, [beat2 + 10, beat2 + 30], [35, 0], {
              ...clamp,
              easing: ease.pop,
            })}
          />
        </g>
      </SceneCanvas>
      <Interactive.Div
        name="No internet label"
        style={{
          position: "absolute",
          left: layout.content.x,
          top: 1030,
          width: layout.content.width,
          textAlign: "center",
          fontFamily: fonts.body,
          fontWeight: weights.bodySemibold,
          fontSize: typeScale.label,
          color: colors.teal[400],
          opacity: beat1Opacity,
        }}
      >
        Works with no internet
      </Interactive.Div>
      <Interactive.Div
        name="Relativity label"
        style={{
          position: "absolute",
          left: layout.content.x,
          top: 990,
          width: layout.content.width,
          textAlign: "center",
          fontFamily: fonts.body,
          fontWeight: weights.bodySemibold,
          fontSize: typeScale.label,
          lineHeight: 1.3,
          color: colors.text.primary,
          opacity: beat2Opacity,
        }}
      >
        Corrected for relativity
        <br />
        <span style={{ color: colors.amber[500] }}>Without it: ~10 km (6 mi) off per day</span>
      </Interactive.Div>
    </AbsoluteFill>
  );
};
```

- [ ] **Step 7: Create `index.tsx`**

```tsx
import { Reel, type ReelProps } from "../../templates/Reel";
import { HookScene } from "./scenes/HookScene";
import { MechanismScene } from "./scenes/MechanismScene";
import { PayoffScene } from "./scenes/PayoffScene";
import { SetupScene } from "./scenes/SetupScene";

export const Post02: React.FC<ReelProps> = (props) => {
  return (
    <Reel
      {...props}
      scenes={{
        hook: HookScene,
        setup: SetupScene,
        mechanism: MechanismScene,
        payoff: PayoffScene,
      }}
    />
  );
};
```

- [ ] **Step 8: Verify**

Run: `npm run lint && npx vitest run`
Expected: pass.

- [ ] **Step 9: Commit**

```bash
git add video/src/posts
git commit -m "feat(post-02): GPS reel script and scenes"
```

---

### Task 14: Register the composition

**Files:**
- Modify: `video/src/Root.tsx`
- Delete: `video/src/Composition.tsx`

- [ ] **Step 1: Replace `video/src/Root.tsx`**

```tsx
import { Composition } from "remotion";
import { video } from "./brand/tokens";
import { Post02 } from "./posts/post-02-gps";
import { script as post02 } from "./posts/post-02-gps/script";
import { calculateReelMetadata } from "./templates/metadata";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Post02-Gps"
        component={Post02}
        durationInFrames={video.fps * 40}
        fps={video.fps}
        width={video.width}
        height={video.height}
        defaultProps={{ script: post02, vo: null, showGuides: false }}
        calculateMetadata={calculateReelMetadata}
      />
    </>
  );
};
```

- [ ] **Step 2: Delete the scaffold composition**

```bash
git rm video/src/Composition.tsx
```

- [ ] **Step 3: Verify**

Run: `npm run lint && npx vitest run`
Expected: pass.

- [ ] **Step 4: Commit**

```bash
git add video/src/Root.tsx
git commit -m "feat(video): register Post02-Gps composition"
```

---

### Task 15: Visual QA with stills

**Files:**
- Create: `video/qa-guides.json`

With estimated timing (no VO yet) the sections start at roughly: hook 0, setup 102, mechanism 276, payoff 774, CTA 1140; total ~1254 frames (~42 s).

- [ ] **Step 1: Create `video/qa-guides.json`**

```json
{ "showGuides": true }
```

- [ ] **Step 2: Render stills with guides**

```bash
for f in 0 60 200 320 520 700 820 1000 1110 1200; do npx remotion still Post02-Gps out/qa/frame-$f.png --frame=$f --props=./qa-guides.json; done
```

Expected: 10 PNGs in `video/out/qa/`.

- [ ] **Step 3: Inspect each still** (Read tool) against the QA checklist:
  - frame 0: hook title fully visible, watermark popping in
  - no text or key visual inside coral zones; hook/visuals inside the dashed 4:5 crop
  - captions sit in the caption band, never overlapping scene visuals
  - mechanism stills show the right step badge per cue
  - 1110: source line visible; 1200: CTA card, no captions or watermark
  - only brand colors visible

Fix any issue in the relevant component or scene, rerun lint and the affected stills.

- [ ] **Step 4: Open the Studio for the user**

Run (background): `npx remotion studio --no-open`
Give the user the URL `http://localhost:3000/Post02-Gps`.

- [ ] **Step 5: Commit**

```bash
git add video/qa-guides.json
git commit -m "chore(video): add safe-zone QA props"
```

---

### Task 16: Sync tracker, script and CLAUDE.md

**Files:**
- Modify: `Unpack_and_Explain_Tracker.xlsx` (Brand + Scripts tabs), `Posts/post_2/script.md`, `CLAUDE.md`

- [ ] **Step 1: Back up the tracker** (from repo root)

```bash
cp Unpack_and_Explain_Tracker.xlsx Unpack_and_Explain_Tracker.backup.xlsx
```

- [ ] **Step 2: Update the Brand and Scripts tabs** with a one-off script saved in the session scratchpad (not the repo), run from repo root with `python <scratchpad>/update_tracker.py`:

```python
import openpyxl
from openpyxl.styles import PatternFill

PATH = "Unpack_and_Explain_Tracker.xlsx"
wb = openpyxl.load_workbook(PATH)  # keeps formulas

brand = wb["Brand"]
updates = {
    "Ink Navy": ("Slate Navy", "#0F172A", "Reel backgrounds (radial to #1E293B)"),
    "Electric Blue": ("Brand Teal", "#2DD4BF", "Diagrams, key highlights, 'correct', FACT stamp"),
    "Signal Amber": ("Signal Amber", "#F59E0B", "Numbers, keywords, active caption word"),
    "Alert Coral": ("Alert Coral", "#FF5A5F", "Only F-post failure segments, MYTH stamp, 'wrong' marks"),
    "Slate": ("Slate", "#94A3B8", "Sources, small labels on dark backgrounds"),
}
for row in brand.iter_rows(min_row=1):
    a, b = row[0], row[1]
    if isinstance(a.value, str) and a.value.startswith("Tagline:"):
        a.value = "Tagline: How things actually work."
    if b.value in updates:
        name, hex_, use = updates[b.value]
        b.value = name
        row[2].value = hex_
        row[3].fill = PatternFill("solid", fgColor=hex_.lstrip("#"))
        row[4].value = use

scripts = wb["Scripts"]
for row in scripts.iter_rows():
    for cell in row:
        if isinstance(cell.value, str) and not cell.value.startswith("=") \
                and "how the world actually works" in cell.value:
            cell.value = cell.value.replace("how the world actually works", "how things actually work")

wb.save(PATH)
print("Tracker updated")
```

Expected: "Tracker updated". Reopen and dump the Brand tab to confirm; confirm the Summary tab formulas still exist (`=` cells unchanged). Delete the backup only after the user confirms.

- [ ] **Step 3: Update `Posts/post_2/script.md` CTA line**: replace "how the world actually works" with "how things actually work" (line 6).

- [ ] **Step 4: Update `CLAUDE.md`**
  - Under **Commands**, add:
    - `npm test`: unit tests incl. brand guard (no colors/fonts outside `src/brand/`)
    - `npm run assets`: regenerate `public/brand/` logos from `logo/`
    - `npm run tts -- post-NN-slug`: generate VO + captions (needs `ELEVENLABS_API_KEY` in `video/.env` and `voice.voiceId`)
    - Studio safe-zone overlay: set `showGuides: true` in the props panel, or `--props=./qa-guides.json` on `remotion still`
  - Under **Motion**, add: "Shared components read tokens (locked brand values). In bespoke scenes, keep layout/keyframes inline in `Interactive.*` styles so Studio can edit them, but colors, fonts and easings still come from `src/brand/`."
  - Under **Per-post workflow** step 2, add: "`script.ts` must pass `validateScript` (section order, source, hook ≤ 28 chars, exact CTA line, F needs `failureSection`). Use `useCue(word, fallback)` to sync visuals to the VO."
  - In **Platform specs**, replace the SafeArea line with: "Scene drawings go inside `SceneCanvas` (clipped to `layout.regions.visual`); text positions must stay inside `layout.regions`."

- [ ] **Step 5: Verify**

Run (from `video/`): `npm run lint && npx vitest run`
Expected: pass.

- [ ] **Step 6: Commit**

```bash
git add Unpack_and_Explain_Tracker.xlsx Posts/post_2/script.md CLAUDE.md
git commit -m "docs: align tracker, post 2 script and CLAUDE.md with video brand system"
```

---

## After the plan (needs the user)

1. Choose an ElevenLabs voice → set `voice.voiceId`; add `ELEVENLABS_API_KEY` to `video/.env`.
2. `npm run tts -- post-02-gps`, then re-check stills (timing changes to real audio).
3. Confirm the two `verify` facts for post 2.
4. Confirm the Instagram handle.
5. Pick a licensed music bed → `public/brand/music/`, set `brand.music`.
6. Render on request: `npx remotion render Post02-Gps out/post-02-gps.mp4`, then check loudness: `npx remotion ffmpeg -i out/post-02-gps.mp4 -af ebur128=peak=true -f null -` (target about -14 LUFS, peak ≤ -1 dBTP).
