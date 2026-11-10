// Small helpers shared by the npm scripts.

// --only=a,b from the arguments, checked against what exists: a typo must not silently
// do nothing (or spend credits on the wrong thing). Null when the flag isn't there.
export const parseOnly = (args: string[], valid: readonly string[]): string[] | null => {
  const flag = args.find((a) => a.startsWith("--only="));
  if (!flag) {
    return null;
  }
  const names = flag.slice("--only=".length).split(",");
  const unknown = names.filter((n) => !valid.includes(n));
  if (unknown.length > 0) {
    throw new Error(`--only: unknown ${unknown.map((n) => `"${n}"`).join(", ")}. Choose from: ${valid.join(", ")}`);
  }
  return names;
};

export const requireApiKey = (): string => {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) {
    throw new Error("ELEVENLABS_API_KEY is missing. Add it to video/.env");
  }
  return key;
};

// Every post's outputs live in out/<post>/, e.g. out/post-07-slug/post-07-slug-cover.png.
export const postOutPath = (postId: string, suffix: string) => `out/${postId}/${postId}-${suffix}`;
