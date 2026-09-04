"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  Bookmark,
  BookmarkCheck,
  ChevronLeft,
  ChevronRight,
  Expand,
  ListTree,
  LoaderCircle,
  Search,
  Volume2,
  VolumeX,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import type { PDFDocumentProxy } from "pdfjs-dist";

import { Button } from "@/components/ui/button";

const PAGE_TURN_SOUND = "/sounds/page-turn.m4a";
const DEFAULT_FLIP_MS = 511;

interface DigitalBookReaderProps {
  fileUrl: string;
  resourceId: string;
  title: string;
  initialProgress?: { lastPage: number; bookmarks: number[] } | null;
}

interface OutlineItem {
  title: string;
  page: number | null;
}

interface FlipState {
  dir: "next" | "prev";
  from: number;
  to: number;
}

export function DigitalBookReader({
  fileUrl,
  resourceId,
  title,
  initialProgress,
}: DigitalBookReaderProps) {
  const shellRef = useRef<HTMLDivElement>(null);
  const touchStart = useRef<number | null>(null);
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [page, setPage] = useState(Math.max(1, initialProgress?.lastPage ?? 1));
  const [pages, setPages] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);
  const soundOn = useSyncExternalStore(subscribeSoundPreference, readSoundPreference, () => true);
  const [bookmarks, setBookmarks] = useState<number[]>(initialProgress?.bookmarks ?? []);
  const [outline, setOutline] = useState<OutlineItem[]>([]);
  const [showOutline, setShowOutline] = useState(false);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchMessage, setSearchMessage] = useState("");
  const [flip, setFlip] = useState<FlipState | null>(null);
  const [shownPage, setShownPage] = useState(Math.max(1, initialProgress?.lastPage ?? 1));
  const [flipMs, setFlipMs] = useState(DEFAULT_FLIP_MS);
  const pageTurnAudio = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 900px)");
    const sync = () => setIsDesktop(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const audio = new Audio(PAGE_TURN_SOUND);
    audio.preload = "auto";
    const syncDuration = () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        setFlipMs(Math.max(180, Math.round(audio.duration * 1000)));
      }
    };
    audio.addEventListener("loadedmetadata", syncDuration);
    pageTurnAudio.current = audio;
    return () => {
      audio.pause();
      audio.removeEventListener("loadedmetadata", syncDuration);
      pageTurnAudio.current = null;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    let task: { destroy: () => Promise<void> } | null = null;
    void (async () => {
      try {
        setLoading(true);
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          "pdfjs-dist/build/pdf.worker.min.mjs",
          import.meta.url
        ).toString();
        const loadingTask = pdfjs.getDocument({ url: fileUrl });
        task = loadingTask;
        const document = await loadingTask.promise;
        if (cancelled) return;
        setPdf(document);
        setPages(document.numPages);
        setPage((current) => Math.min(current, document.numPages));
        setShownPage((current) => Math.min(current, document.numPages));
        setOutline(await loadOutline(document));
        setLoading(false);
      } catch (loadError) {
        console.error("PDF reader failed:", loadError);
        if (!cancelled) {
          setError("This book could not be opened. The file may be unavailable or malformed.");
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
      void task?.destroy();
    };
  }, [fileUrl]);

  const persist = useCallback(
    (nextPage: number, nextBookmarks: number[]) => {
      if (!pages) return;
      void fetch(`/api/student/resources/${resourceId}/reading-progress`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lastPage: nextPage, totalPages: pages, bookmarks: nextBookmarks }),
        keepalive: true,
      }).catch(() => undefined);
    },
    [pages, resourceId]
  );

  const changePage = useCallback(
    (target: number, withSound = true) => {
      if (!pages || flip) return;
      const next = Math.min(Math.max(1, target), pages);
      if (next === page) return;
      const dir = next > page ? "next" : "prev";
      setFlip({ dir, from: page, to: next });
      setPage(next);
      persist(next, bookmarks);
      if (withSound && soundOn) {
        const audio = pageTurnAudio.current;
        if (audio) {
          audio.currentTime = 0;
          void audio.play().catch(() => undefined);
        }
      }
    },
    [bookmarks, flip, page, pages, persist, soundOn]
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") changePage(page - (isDesktop ? 2 : 1));
      if (event.key === "ArrowRight") changePage(page + (isDesktop ? 2 : 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [changePage, isDesktop, page]);

  function finishFlip() {
    setShownPage(page);
    setFlip(null);
  }

  useEffect(() => {
    if (!flip) return;
    const timeout = window.setTimeout(() => {
      setShownPage(page);
      setFlip(null);
    }, flipMs + 40);
    return () => window.clearTimeout(timeout);
  }, [flip, flipMs, page]);

  function toggleBookmark() {
    const next = bookmarks.includes(page)
      ? bookmarks.filter((item) => item !== page)
      : [...bookmarks, page].sort((a, b) => a - b);
    setBookmarks(next);
    persist(page, next);
  }

  async function searchDocument() {
    if (!pdf || !query.trim()) return;
    setSearching(true);
    setSearchMessage("");
    const needle = query.trim().toLocaleLowerCase();
    try {
      for (let number = 1; number <= pdf.numPages; number += 1) {
        const pdfPage = await pdf.getPage(number);
        const text = await pdfPage.getTextContent();
        const haystack = text.items
          .map((item) => ("str" in item ? item.str : ""))
          .join(" ")
          .toLocaleLowerCase();
        pdfPage.cleanup();
        if (haystack.includes(needle)) {
          changePage(number);
          setSearchMessage(`Found on page ${number}.`);
          return;
        }
      }
      setSearchMessage("No matches found.");
    } catch {
      setSearchMessage("Search is unavailable for this document.");
    } finally {
      setSearching(false);
    }
  }

  if (loading) {
    return (
      <div className="book-studio flex min-h-[32rem] items-center justify-center rounded-[1.4rem] border border-[#eadfce] text-slate-700" aria-busy="true">
        <div className="text-center">
          <LoaderCircle className="mx-auto h-8 w-8 animate-spin text-amber-800/70" />
          <p className="mt-3 text-sm">Opening your book…</p>
        </div>
      </div>
    );
  }

  if (error || !pdf) {
    return (
      <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-10 text-center text-red-900">
        <p className="font-semibold">Unable to open this book</p>
        <p className="mt-2 text-sm">{error}</p>
      </div>
    );
  }

  const step = isDesktop ? 2 : 1;
  const pair = (start: number) => {
    const left = start;
    const right = isDesktop && start < pages ? start + 1 : null;
    return { left, right };
  };
  const current = pair(flip ? shownPage : page);
  const incoming = pair(page);
  const isSpread = Boolean(current.right || incoming.right);
  const progress = Math.round((page / pages) * 100);
  const pageLabel = current.right ? `${current.left}–${current.right}` : `${current.left}`;

  const baseLeft = flip?.dir === "prev" || (!isSpread && flip) ? incoming.left : current.left;
  const baseRight = flip?.dir === "next" ? incoming.right : current.right;
  const leafFront = flip
    ? flip.dir === "next"
      ? current.right ?? current.left
      : current.left
    : null;
  const leafBack = flip
    ? flip.dir === "next"
      ? incoming.left
      : incoming.right ?? incoming.left
    : null;

  return (
    <div
      ref={shellRef}
      className="book-studio overflow-hidden rounded-[1.4rem] border border-[#eadfce] text-slate-800 shadow-[0_24px_60px_-32px_rgba(62,41,24,0.45)]"
      style={{ ["--book-flip-duration" as string]: `${flipMs}ms` }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#eadfce] bg-white/80 px-3 py-3 sm:px-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">{title}</p>
          <p className="text-xs text-slate-500">
            Page {pageLabel} of {pages} · {progress}% read
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1">
          <ReaderButton label="Contents" onClick={() => setShowOutline((value) => !value)}>
            <ListTree />
          </ReaderButton>
          <ReaderButton label={bookmarks.includes(page) ? "Remove bookmark" : "Bookmark page"} onClick={toggleBookmark}>
            {bookmarks.includes(page) ? <BookmarkCheck /> : <Bookmark />}
          </ReaderButton>
          <ReaderButton label="Zoom out" onClick={() => setZoom((value) => Math.max(0.65, value - 0.15))}>
            <ZoomOut />
          </ReaderButton>
          <ReaderButton label="Zoom in" onClick={() => setZoom((value) => Math.min(2.2, value + 0.15))}>
            <ZoomIn />
          </ReaderButton>
          <ReaderButton
            label={soundOn ? "Turn page sound off" : "Turn page sound on"}
            onClick={() => {
              const next = !soundOn;
              window.localStorage.setItem("sdi-reader-sound", next ? "on" : "off");
              window.dispatchEvent(new Event("sdi-reader-sound-change"));
            }}
          >
            {soundOn ? <Volume2 /> : <VolumeX />}
          </ReaderButton>
          <ReaderButton label="Fullscreen" onClick={() => void shellRef.current?.requestFullscreen()}>
            <Expand />
          </ReaderButton>
        </div>
      </div>

      <div className="grid lg:grid-cols-[auto_minmax(0,1fr)]">
        {showOutline ? (
          <aside className="max-h-[70vh] w-full overflow-y-auto border-b border-[#eadfce] bg-white/90 p-4 lg:w-64 lg:border-b-0 lg:border-r">
            <h3 className="text-sm font-semibold text-slate-900">Contents</h3>
            {outline.length ? (
              <ul className="mt-3 space-y-1">
                {outline.map((item, index) => (
                  <li key={`${item.title}-${index}`}>
                    <button
                      type="button"
                      disabled={!item.page}
                      onClick={() => item.page && changePage(item.page)}
                      className="w-full rounded-lg px-2 py-1.5 text-left text-xs text-slate-600 hover:bg-[#f4eee4] disabled:cursor-default disabled:text-slate-400"
                    >
                      {item.title}
                      {item.page ? ` · ${item.page}` : ""}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-xs text-slate-500">This PDF has no table of contents.</p>
            )}
            {bookmarks.length ? (
              <div className="mt-5 border-t border-[#eadfce] pt-4">
                <h3 className="text-sm font-semibold text-slate-900">Bookmarks</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {bookmarks.map((number) => (
                    <button
                      key={number}
                      type="button"
                      onClick={() => changePage(number)}
                      className="rounded-md bg-[#f4eee4] px-2 py-1 text-xs text-slate-700 hover:bg-[#ebe3d4]"
                    >
                      Page {number}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </aside>
        ) : null}

        <div className="min-w-0">
          <form
            className="flex flex-wrap items-center gap-2 border-b border-[#eadfce] bg-white/70 px-3 py-2"
            onSubmit={(event) => {
              event.preventDefault();
              void searchDocument();
            }}
          >
            <div className="relative min-w-44 flex-1 sm:max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search this book"
                className="h-9 w-full rounded-lg border border-[#eadfce] bg-white pl-8 pr-3 text-sm text-slate-800 placeholder:text-slate-400"
              />
            </div>
            <Button type="submit" size="sm" variant="secondary" isLoading={searching}>
              Search
            </Button>
            {searchMessage ? (
              <span className="text-xs text-slate-500" role="status">
                {searchMessage}
              </span>
            ) : null}
          </form>

          <div
            className="book-stage relative flex min-h-[58vh] items-center justify-center overflow-hidden px-3 py-6 sm:px-8 sm:py-8"
            onTouchStart={(event) => {
              touchStart.current = event.changedTouches[0]?.clientX ?? null;
            }}
            onTouchEnd={(event) => {
              const start = touchStart.current;
              const end = event.changedTouches[0]?.clientX;
              if (start !== null && end !== undefined && Math.abs(start - end) > 45) {
                changePage(start > end ? page + step : page - step);
              }
              touchStart.current = null;
            }}
          >
            <div className="book-block w-full max-w-5xl p-[10px] sm:p-[12px]">
              <span className="book-stack is-left" aria-hidden="true" />
              <span className="book-stack is-right" aria-hidden="true" />
              <div className={`book-spread ${isSpread ? "is-spread" : ""}`}>
                <div className={`book-page-slot ${isSpread ? "is-left" : ""}`}>
                  <PdfCanvas pdf={pdf} pageNumber={baseLeft} scale={zoom} />
                </div>
                {isSpread && baseRight ? (
                  <div className="book-page-slot is-right">
                    <PdfCanvas pdf={pdf} pageNumber={baseRight} scale={zoom} />
                  </div>
                ) : isSpread ? (
                  <div className="book-page-slot is-right" />
                ) : null}
                {isSpread ? <span className="book-gutter" aria-hidden="true" /> : null}

                {flip && leafFront && leafBack ? (
                  <div
                    className={`book-leaf ${isSpread ? "" : "is-single"} ${flip.dir === "next" ? "is-forward" : "is-back"}`}
                    onAnimationEnd={(event) => {
                      if (event.target === event.currentTarget) finishFlip();
                    }}
                  >
                    <div className="book-leaf-face">
                      <PdfCanvas pdf={pdf} pageNumber={leafFront} scale={zoom} />
                    </div>
                    <div className="book-leaf-face is-back">
                      <PdfCanvas pdf={pdf} pageNumber={leafBack} scale={zoom} />
                    </div>
                    <span className="book-leaf-shade" aria-hidden="true" />
                  </div>
                ) : null}
              </div>
            </div>
            <button
              type="button"
              aria-label="Previous page"
              onClick={() => changePage(page - step)}
              disabled={page === 1 || Boolean(flip)}
              className="absolute inset-y-0 left-0 w-1/5 cursor-w-resize disabled:cursor-default"
            />
            <button
              type="button"
              aria-label="Next page"
              onClick={() => changePage(page + step)}
              disabled={page >= pages || Boolean(flip)}
              className="absolute inset-y-0 right-0 w-1/5 cursor-e-resize disabled:cursor-default"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#eadfce] bg-white/80 px-3 py-3 sm:px-4">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1 || Boolean(flip)}
              onClick={() => changePage(page - step)}
              className="border-[#eadfce] bg-white text-slate-800 hover:bg-[#f7f1e6]"
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </Button>
            <label className="flex items-center gap-2 text-xs text-slate-600">
              Jump to page
              <input
                type="number"
                min={1}
                max={pages}
                value={page}
                onChange={(event) => changePage(Number(event.target.value), false)}
                className="h-8 w-20 rounded-md border border-[#eadfce] bg-white px-2 text-center text-slate-800"
              />
            </label>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= pages || Boolean(flip)}
              onClick={() => changePage(page + step)}
              className="border-[#eadfce] bg-white text-slate-800 hover:bg-[#f7f1e6]"
            >
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="h-1 bg-[#eadfce]">
            <div className="h-full bg-amber-800/70 transition-[width]" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ReaderButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactElement<{ className?: string }>;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-[#f4eee4] hover:text-slate-900"
    >
      {children}
    </button>
  );
}

function PdfCanvas({ pdf, pageNumber, scale }: { pdf: PDFDocumentProxy; pageNumber: number; scale: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let cancelled = false;
    let renderTask: { cancel: () => void; promise: Promise<unknown> } | null = null;
    void (async () => {
      try {
        const pdfPage = await pdf.getPage(pageNumber);
        const viewport = pdfPage.getViewport({ scale: 1.2 * scale });
        const canvas = canvasRef.current;
        if (!canvas || cancelled) return;
        const context = canvas.getContext("2d");
        if (!context) return;
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        renderTask = pdfPage.render({ canvas, canvasContext: context, viewport });
        await renderTask.promise;
      } catch (renderError) {
        if (!cancelled && (renderError as { name?: string }).name !== "RenderingCancelledException") setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
      renderTask?.cancel();
    };
  }, [pageNumber, pdf, scale]);
  if (failed) {
    return (
      <div className="flex aspect-[3/4] w-full items-center justify-center bg-[#fffdf8] p-6 text-center text-sm text-red-700">
        Page {pageNumber} could not be rendered.
      </div>
    );
  }
  return <canvas ref={canvasRef} aria-label={`Page ${pageNumber}`} />;
}

async function loadOutline(pdf: PDFDocumentProxy): Promise<OutlineItem[]> {
  const raw = await pdf.getOutline();
  if (!raw) return [];
  const flat: OutlineItem[] = [];
  const walk = async (items: typeof raw) => {
    for (const item of items.slice(0, 60 - flat.length)) {
      let page: number | null = null;
      try {
        const destination = typeof item.dest === "string" ? await pdf.getDestination(item.dest) : item.dest;
        if (destination?.[0]) page = (await pdf.getPageIndex(destination[0])) + 1;
      } catch {
        page = null;
      }
      flat.push({ title: item.title || "Untitled section", page });
      if (item.items?.length && flat.length < 60) await walk(item.items);
    }
  };
  await walk(raw);
  return flat;
}

function subscribeSoundPreference(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("sdi-reader-sound-change", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("sdi-reader-sound-change", callback);
  };
}

function readSoundPreference() {
  return window.localStorage.getItem("sdi-reader-sound") !== "off";
}
