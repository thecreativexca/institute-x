import assert from "node:assert/strict";
import test from "node:test";

import { buildYouTubeEmbedUrl, parseYouTubeVideoId } from "./youtube";

const VIDEO_ID = "4ZwDsAGJmXw";

test("parses supported YouTube URL formats to the same video id", () => {
  const urls = [
    `https://www.youtube.com/watch?v=${VIDEO_ID}`,
    `https://youtube.com/watch?v=${VIDEO_ID}`,
    `https://youtu.be/${VIDEO_ID}`,
    `https://www.youtube.com/embed/${VIDEO_ID}`,
    `https://youtube.com/shorts/${VIDEO_ID}`,
  ];

  for (const url of urls) {
    assert.equal(parseYouTubeVideoId(url), VIDEO_ID);
  }
});

test("builds the canonical YouTube player URL", () => {
  assert.equal(
    buildYouTubeEmbedUrl(VIDEO_ID),
    `https://www.youtube.com/embed/${VIDEO_ID}?rel=0&playsinline=1`
  );
});
