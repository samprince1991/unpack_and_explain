// "post-21-jet-engine" -> "Cover21-JetEngine" (Studio composition id of the 3D cover).
export const coverCompositionId = (postId: string) => {
  const [, num, ...slug] = postId.split("-");
  return `Cover${num}-${slug.map((w) => w[0].toUpperCase() + w.slice(1)).join("")}`;
};
