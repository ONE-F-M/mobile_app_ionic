import { beforeEach, describe, expect, test } from "vitest";
import { FONT_URLS, loadLocaleFonts } from "@/utils/localeFonts.js";

const links = () => [...document.head.querySelectorAll("link[data-locale-font]")];

describe("loadLocaleFonts", () => {
  beforeEach(() => {
    links().forEach((link) => link.remove());
  });

  test("English loads only the Latin fonts", () => {
    loadLocaleFonts(["en"]);
    expect(links().map((link) => link.href)).toEqual([FONT_URLS.en]);
    expect(FONT_URLS.en).not.toMatch(/Cairo|Noto/);
  });

  test("Arabic loads Cairo with the fonts that scoped styles still name", () => {
    loadLocaleFonts(["ar"]);
    expect(links().map((link) => link.dataset.localeFont)).toEqual(["ar"]);
    expect(FONT_URLS.ar).toMatch(/Cairo/);
    expect(FONT_URLS.ar).toMatch(/Readex\+Pro/);
    expect(FONT_URLS.ar).toMatch(/Roboto/);
    expect(FONT_URLS.ar).not.toMatch(/Inter|Noto/);
  });

  test("a language already on the page is not added again", () => {
    loadLocaleFonts(["en", "ar"]);
    loadLocaleFonts(["ar"]);
    loadLocaleFonts(["en"]);
    expect(links().map((link) => link.dataset.localeFont)).toEqual(["en", "ar"]);
  });
});
