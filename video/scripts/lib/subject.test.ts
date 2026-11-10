import { describe, expect, it } from "vitest";
import { firstSentence, mentionsTopic, opensOnTopic } from "./subject";

describe("mentionsTopic", () => {
  it("matches whole words, any case", () => {
    expect(mentionsTopic("Do you know how GPS finds you?", "GPS")).toBe(true);
    expect(mentionsTopic("Do you know how gpsx works?", "GPS")).toBe(false);
  });

  it("ignores articles and tolerates singular/plural", () => {
    expect(mentionsTopic("Do you know how a hovercraft floats?", "a hovercraft")).toBe(true);
    expect(mentionsTopic("Every ship shoves water aside.", "ships")).toBe(true);
    expect(mentionsTopic("Why do air taxis have 12 propellers?", "air taxi")).toBe(true);
    expect(mentionsTopic("Myth: planes fly because air pushes up", "plane")).toBe(true);
    expect(mentionsTopic("Why batteries fade in the cold", "battery")).toBe(true);
    expect(mentionsTopic("How GPS finds you", "GPS")).toBe(true);
  });

  it("needs every topic word", () => {
    expect(mentionsTopic("Who approves your card?", "card payment")).toBe(false);
  });

  it("is false for an empty topic", () => {
    expect(mentionsTopic("anything", "")).toBe(false);
  });
});

describe("firstSentence / opensOnTopic", () => {
  it("cuts at the first sentence end, not inside a name like SR.N4", () => {
    expect(firstSentence("A boat drags. A car grips.")).toBe("A boat drags.");
    expect(firstSentence("The SR.N4 weighed 320 tonnes. It carried cars.")).toBe("The SR.N4 weighed 320 tonnes.");
  });

  it("accepts the topic or a back-reference opener", () => {
    expect(opensOnTopic("A hovercraft never touches the water. Nothing holds it.", "a hovercraft")).toBe(true);
    expect(opensOnTopic("It isn't a grade on your wealth. It's a prediction.", "credit score")).toBe(true);
    expect(opensOnTopic("That's only part of the story.", "plane")).toBe(true);
  });

  it("skips a MYTH: / FACT: stamp label (Q posts)", () => {
    expect(firstSentence("MYTH: an air taxi is a giant drone. Stop one propeller.")).toBe("an air taxi is a giant drone.");
    expect(opensOnTopic("MYTH: an air taxi is a giant drone.", "air taxi")).toBe(true);
  });

  it("rejects a setup that opens on something else", () => {
    expect(opensOnTopic("A boat drags through water. A hovercraft touches neither.", "a hovercraft")).toBe(false);
  });
});
