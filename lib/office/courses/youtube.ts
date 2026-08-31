/**
 * Centralized YouTube URL handling (Phase 17, req. 43–46).
 * Both the Office Portal and Student Portal import from this single module —
 * URL parsing is never duplicated.
 */

export interface ParsedYouTubeVideo {
  videoId: string;
  embedUrl: string;
  watchUrl: string;
}

/** Only youtube.com / youtu.be / youtube-nocookie.com hosts are accepted. */
const ALLOWED_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtu.be",
  "www.youtu.be",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
]);

/** 11-char YouTube video id. */
const VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

/**
 * Parses a YouTube URL (watch, share, embed, shorts or live) into the
 * canonical video id. Returns null for anything that is not a safe
 * YouTube URL (e.g. https://evil.example/video) or a malformed URL.
 */
export function parseYouTubeVideoId(rawUrl: string): string | null {
  const trimmed = (rawUrl ?? "").trim();
  if (!trimmed) return null;

  // Accept a bare 11-char video id as a convenience.
  if (VIDEO_ID_PATTERN.test(trimmed)) return trimmed;

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  if (!ALLOWED_HOSTS.has(url.hostname.toLowerCase())) return null;

  let candidate: string | null = null;

  if (url.hostname.toLowerCase().endsWith("youtu.be")) {
    candidate = url.pathname.split("/").filter(Boolean)[0] ?? null;
  } else {
    const path = url.pathname.replace(/\/+$/, "");
    const segments = path.split("/").filter(Boolean);
    if (segments[0] === "watch") {
      candidate = url.searchParams.get("v");
    } else if (
      (segments[0] === "embed" ||
        segments[0] === "shorts" ||
        segments[0] === "live" ||
        segments[0] === "v") &&
      segments[1]
    ) {
      candidate = segments[1];
    }
  }

  if (!candidate) return null;
  const videoId = candidate.split("/")[0].split("?")[0];
  return VIDEO_ID_PATTERN.test(videoId) ? videoId : null;
}

/** Builds the privacy-enhanced embed URL for a video id. */
export function buildYouTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0`;
}

/** Builds the canonical watch URL for a video id. */
export function buildYouTubeWatchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

/**
 * Normalizes any accepted YouTube URL into { videoId, embedUrl, watchUrl }.
 * Returns null when the URL is not a valid YouTube URL.
 */
export function normalizeYouTubeUrl(rawUrl: string): ParsedYouTubeVideo | null {
  const videoId = parseYouTubeVideoId(rawUrl);
  if (!videoId) return null;
  return {
    videoId,
    embedUrl: buildYouTubeEmbedUrl(videoId),
    watchUrl: buildYouTubeWatchUrl(videoId),
  };
}
