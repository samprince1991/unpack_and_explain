import { describe, expect, it } from "vitest";
import type { CarouselScript, CarouselSlide } from "./types";
import { validateCarousel } from "./validate";

const words = (n: number) => Array.from({ length: n }, () => "word").join(" ");
const slide = (kind: CarouselSlide["kind"], headline = "A short headline", body = "Some body text."): CarouselSlide => ({
  kind,
  headline,
  body,
});

const base: CarouselScript = {
  id: "post-99-test",
  postNumber: 99,
  title: "Test",
  source: "Somewhere.gov",
  slides: [
    slide("cover", "Six words make a cover"),
    slide("content"),
    slide("content"),
    slide("content"),
    slide("recap"),
    slide("cta"),
  ],
  verify: [],
};

const withSlides = (slides: CarouselSlide[]): CarouselScript => ({ ...base, slides });

describe("validateCarousel", () => {
  it("accepts a valid carousel", () => {
    expect(validateCarousel(base)).toEqual({ errors: [], warnings: [] });
  });

  it("needs 6-10 slides", () => {
    expect(validateCarousel(withSlides(base.slides.slice(1))).errors.join()).toMatch(/6-10 slides/);
  });

  it("needs cover first, recap second-to-last and cta last", () => {
    const swapped = [...base.slides];
    [swapped[4], swapped[5]] = [swapped[5], swapped[4]];
    const { errors } = validateCarousel(withSlides(swapped));
    expect(errors).toContain("slide 5 must be recap, got cta");
    expect(errors).toContain("slide 6 must be cta, got recap");
  });

  it("limits the cover to 6 words and other headlines to 7", () => {
    const slides = [...base.slides];
    slides[0] = slide("cover", words(7));
    slides[1] = slide("content", words(8));
    const { errors } = validateCarousel(withSlides(slides));
    expect(errors).toContain("slide 1 headline needs 1-6 words, got 7");
    expect(errors).toContain("slide 2 headline needs 1-7 words, got 8");
  });

  it("limits bodies to 25 words", () => {
    const slides = [...base.slides];
    slides[2] = slide("content", "Fine", words(26));
    expect(validateCarousel(withSlides(slides)).errors).toContain("slide 3 body has 26 words, max 25");
  });

  it("requires a source", () => {
    expect(validateCarousel({ ...base, source: " " }).errors).toContain("source is required");
  });

  it('rejects "!"', () => {
    const slides = [...base.slides];
    slides[1] = slide("content", "Wow", "So fast!");
    expect(validateCarousel(withSlides(slides)).errors).toContain('slide 2 must not use "!"');
  });
});
