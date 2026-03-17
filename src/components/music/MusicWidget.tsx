import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LuListMusic,
  LuMusic2,
  LuPause,
  LuPlay,
  LuRepeat,
  LuRepeat1,
  LuShuffle,
  LuSkipBack,
  LuSkipForward,
  LuVolume2,
} from "react-icons/lu";

type Track = {
  title: string;
  artist?: string;
  src?: string;
  file?: string;
  cover?: string;
};

type Playlist = {
  id: string;
  name: string;
  basePath?: string;
  tracks: Track[];
};

type LibraryJson = {
  playlists?: Playlist[];
  tracks?: Track[];
  basePath?: string;
};

type LoopMode = "one" | "all";
type ActivePanel = "queue" | "volume" | null;

type EmbeddedCoverMap = Record<string, string | null>;

const SUPPORTED_LANGS = ["en", "es", "ja", "fr", "de", "pt", "pl", "ru", "zh", "ko", "th", "fil"] as const;
const ENABLED_PAGES = ["/", "/projects", "/contact"];
const STORAGE = {
  isOpen: "musicWidget.isOpen.v1",
  playlistId: "musicWidget.playlistId.v1",
};

const ACCENT = {
  color: "#22d38e",
  rgb: "34, 211, 142",
} as const;

function safeJsonParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function formatTime(value: number) {
  if (!Number.isFinite(value) || value < 0) return "0:00";
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function pickRandomIndex(length: number, currentIndex: number, randomValue = Math.random()) {
  if (length <= 1) return currentIndex;
  const pool = Array.from({ length }, (_, index) => index).filter((index) => index !== currentIndex);
  const clamped = Math.min(0.999999, Math.max(0, randomValue));
  const poolIndex = Math.floor(clamped * pool.length);
  return pool[poolIndex] ?? currentIndex;
}

function normalizePathname(pathname: string): string {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 0) return "/";

  const first = parts[0]?.toLowerCase();
  if (first && (SUPPORTED_LANGS as readonly string[]).includes(first)) {
    const rest = parts.slice(1);
    return rest.length ? `/${rest.join("/")}` : "/";
  }
  return `/${parts.join("/")}`;
}

function isEnabledPath(pathname: string) {
  return ENABLED_PAGES.some((page) => {
    if (page === "/") return pathname === "/";
    return pathname === page || pathname.startsWith(`${page}/`);
  });
}

function isAbsoluteUrl(path: string) {
  return /^(https?:)?\/\//.test(path) || path.startsWith("/");
}

function bytesToBase64(bytes: Uint8Array) {
  if (typeof window === "undefined") return "";

  let binary = "";
  const chunkSize = 0x8000;

  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return window.btoa(binary);
}

function readSynchsafeInt(bytes: Uint8Array, offset: number) {
  return (
    ((bytes[offset] ?? 0) << 21) |
    ((bytes[offset + 1] ?? 0) << 14) |
    ((bytes[offset + 2] ?? 0) << 7) |
    (bytes[offset + 3] ?? 0)
  );
}

function readUInt32(bytes: Uint8Array, offset: number) {
  return (
    (((bytes[offset] ?? 0) << 24) >>> 0) |
    ((bytes[offset + 1] ?? 0) << 16) |
    ((bytes[offset + 2] ?? 0) << 8) |
    (bytes[offset + 3] ?? 0)
  );
}

function readUInt24(bytes: Uint8Array, offset: number) {
  return (
    ((bytes[offset] ?? 0) << 16) |
    ((bytes[offset + 1] ?? 0) << 8) |
    (bytes[offset + 2] ?? 0)
  );
}

function decodeAscii(bytes: Uint8Array, offset: number, length: number) {
  return String.fromCharCode(...bytes.subarray(offset, offset + length));
}

function isEmptyFrameId(frameId: string) {
  if (!frameId) return true;

  for (const char of frameId) {
    if (char.charCodeAt(0) !== 0 && char.trim() !== "") {
      return false;
    }
  }

  return true;
}

function findTextTerminator(bytes: Uint8Array, start: number, encoding: number) {
  const isWide = encoding === 1 || encoding === 2;

  if (!isWide) {
    for (let index = start; index < bytes.length; index += 1) {
      if (bytes[index] === 0) return index;
    }
    return bytes.length;
  }

  for (let index = start; index + 1 < bytes.length; index += 2) {
    if (bytes[index] === 0 && bytes[index + 1] === 0) return index;
  }

  return bytes.length;
}

function buildImageDataUrl(mime: string, imageBytes: Uint8Array) {
  const base64 = bytesToBase64(imageBytes);
  if (!base64) return null;
  return `data:${mime};base64,${base64}`;
}

function parseApicFrame(frameBytes: Uint8Array) {
  if (frameBytes.length < 4) return null;

  const encoding = frameBytes[0] ?? 0;
  let cursor = 1;

  let mimeEnd = cursor;
  while (mimeEnd < frameBytes.length && frameBytes[mimeEnd] !== 0) {
    mimeEnd += 1;
  }

  const mime = decodeAscii(frameBytes, cursor, Math.max(0, mimeEnd - cursor)) || "image/jpeg";
  cursor = Math.min(frameBytes.length, mimeEnd + 1);

  cursor += 1;
  if (cursor >= frameBytes.length) return null;

  const descriptionEnd = findTextTerminator(frameBytes, cursor, encoding);
  const terminatorLength = encoding === 1 || encoding === 2 ? 2 : 1;
  const imageStart = Math.min(frameBytes.length, descriptionEnd + terminatorLength);
  const imageBytes = frameBytes.subarray(imageStart);

  if (!imageBytes.length) return null;
  return buildImageDataUrl(mime, imageBytes);
}

function parsePicFrame(frameBytes: Uint8Array) {
  if (frameBytes.length < 6) return null;

  const encoding = frameBytes[0] ?? 0;
  const format = decodeAscii(frameBytes, 1, 3).toUpperCase();
  const mime =
    format === "PNG"
      ? "image/png"
      : format === "JPG" || format === "JPEG"
        ? "image/jpeg"
        : `image/${format.toLowerCase()}`;

  let cursor = 4;
  cursor += 1;
  if (cursor >= frameBytes.length) return null;

  const descriptionEnd = findTextTerminator(frameBytes, cursor, encoding);
  const terminatorLength = encoding === 1 || encoding === 2 ? 2 : 1;
  const imageStart = Math.min(frameBytes.length, descriptionEnd + terminatorLength);
  const imageBytes = frameBytes.subarray(imageStart);

  if (!imageBytes.length) return null;
  return buildImageDataUrl(mime, imageBytes);
}

function extractEmbeddedCoverFromBytes(bytes: Uint8Array) {
  if (bytes.length < 10) return null;
  if (decodeAscii(bytes, 0, 3) !== "ID3") return null;

  const version = bytes[3] ?? 0;
  const flags = bytes[5] ?? 0;
  const tagSize = readSynchsafeInt(bytes, 6);
  const tagEnd = Math.min(bytes.length, 10 + tagSize);

  let offset = 10;

  if ((flags & 0x40) !== 0) {
    if (version === 3 && offset + 4 <= tagEnd) {
      const extSize = readUInt32(bytes, offset);
      offset += 4 + extSize;
    } else if (version === 4 && offset + 4 <= tagEnd) {
      const extSize = readSynchsafeInt(bytes, offset);
      offset += extSize;
    }
  }

  while (offset < tagEnd) {
    if (version === 2) {
      if (offset + 6 > tagEnd) break;

      const frameId = decodeAscii(bytes, offset, 3);
      const frameSize = readUInt24(bytes, offset + 3);
      const frameHeaderSize = 6;

      if (isEmptyFrameId(frameId) || frameSize <= 0) break;

      const frameStart = offset + frameHeaderSize;
      const frameEnd = Math.min(tagEnd, frameStart + frameSize);

      if (frameId === "PIC") {
        return parsePicFrame(bytes.subarray(frameStart, frameEnd));
      }

      offset = frameEnd;
      continue;
    }

    if (offset + 10 > tagEnd) break;

    const frameId = decodeAscii(bytes, offset, 4);
    const frameSize = version === 4 ? readSynchsafeInt(bytes, offset + 4) : readUInt32(bytes, offset + 4);
    const frameHeaderSize = 10;

    if (isEmptyFrameId(frameId) || frameSize <= 0) break;

    const frameStart = offset + frameHeaderSize;
    const frameEnd = Math.min(tagEnd, frameStart + frameSize);

    if (frameId === "APIC") {
      return parseApicFrame(bytes.subarray(frameStart, frameEnd));
    }

    offset = frameEnd;
  }

  return null;
}

async function extractEmbeddedCover(src: string): Promise<string | null> {
  try {
    const response = await fetch(src, {
      cache: "force-cache",
      headers: {
        Range: "bytes=0-262143",
      },
    });

    if (!response.ok && response.status !== 206) return null;

    const buffer = await response.arrayBuffer();
    return extractEmbeddedCoverFromBytes(new Uint8Array(buffer));
  } catch {
    return null;
  }
}

async function tryFetchJson(url: string): Promise<unknown | null> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as unknown;
  } catch {
    return null;
  }
}

function coerceTrack(input: unknown): Track | null {
  if (!input || typeof input !== "object") return null;
  const raw = input as Track;

  return {
    title: typeof raw.title === "string" && raw.title.trim() ? raw.title.trim() : "Untitled",
    artist: typeof raw.artist === "string" ? raw.artist : undefined,
    src: typeof raw.src === "string" ? raw.src : undefined,
    file: typeof raw.file === "string" ? raw.file : undefined,
    cover: typeof raw.cover === "string" ? raw.cover : undefined,
  };
}

function coerceLibrary(input: unknown): { playlists: Playlist[] } | null {
  if (!input || typeof input !== "object") return null;
  const maybe = input as LibraryJson;

  if (Array.isArray(maybe.playlists) && maybe.playlists.length) {
    const playlists: Playlist[] = maybe.playlists
      .filter((p) => p && typeof p === "object")
      .map((p) => {
        const pl = p as Playlist;
        const tracks = Array.isArray(pl.tracks)
          ? (pl.tracks.map(coerceTrack).filter(Boolean) as Track[])
          : [];

        return {
          id: String(pl.id),
          name: String(pl.name ?? pl.id),
          basePath: typeof pl.basePath === "string" ? pl.basePath : undefined,
          tracks,
        };
      })
      .filter((p) => p.id && p.tracks.length);

    return playlists.length ? { playlists } : null;
  }

  if (Array.isArray(maybe.tracks) && maybe.tracks.length) {
    const basePath = typeof maybe.basePath === "string" ? maybe.basePath : "/assets/music";
    const tracks = maybe.tracks.map(coerceTrack).filter(Boolean) as Track[];

    if (!tracks.length) return null;

    return {
      playlists: [
        {
          id: "default",
          name: "Music",
          basePath,
          tracks,
        },
      ],
    };
  }

  return null;
}

function resolveTrackSrc(track: Track, basePath?: string): string | null {
  if (typeof track.src === "string" && track.src.trim()) return track.src;
  const base = (basePath?.trim() ? basePath : "/assets/music").replace(/\/$/, "");
  if (typeof track.file === "string" && track.file.trim()) {
    return `${base}/${track.file.replace(/^\//, "")}`;
  }
  return null;
}

function resolveTrackCover(track: Track, basePath?: string): string | null {
  if (typeof track.cover !== "string" || !track.cover.trim()) return null;
  if (isAbsoluteUrl(track.cover)) return track.cover;

  const base = (basePath?.trim() ? basePath : "/assets/music").replace(/\/$/, "");
  return `${base}/${track.cover.replace(/^\//, "")}`;
}

if (typeof window !== "undefined") {
  console.assert(formatTime(0) === "0:00", "formatTime should format zero");
  console.assert(formatTime(65) === "1:05", "formatTime should pad seconds");
  console.assert(pickRandomIndex(1, 0, 0.5) === 0, "pickRandomIndex should keep same when only one track");
  console.assert(isEnabledPath("/") === true, "root path should be enabled");
  console.assert(isEnabledPath("/blog") === false, "unlisted path should stay disabled");
}

export default function MusicWidget() {
  const location = useLocation();

  const [isOpen, setIsOpen] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const saved = safeJsonParse<boolean>(window.localStorage.getItem(STORAGE.isOpen));
    return typeof saved === "boolean" ? saved : false;
  });

  const [library, setLibrary] = useState<{ playlists: Playlist[] } | null>(null);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string>(() => {
    if (typeof window === "undefined") return "playlist1";
    const saved = window.localStorage.getItem(STORAGE.playlistId);
    return saved && saved.trim() ? saved : "playlist1";
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.72);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);
  const [loopMode, setLoopMode] = useState<LoopMode>("all");
  const [isShuffle, setIsShuffle] = useState(false);
  const [embeddedCovers, setEmbeddedCovers] = useState<EmbeddedCoverMap>({});

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const normalizedPath = normalizePathname(location.pathname);
  const shouldRenderPlayer = isEnabledPath(normalizedPath);

  const playlists = library?.playlists ?? [];
  const selectedPlaylist = useMemo(() => {
    if (!playlists.length) return null;
    return playlists.find((p) => p.id === selectedPlaylistId) ?? playlists[0] ?? null;
  }, [playlists, selectedPlaylistId]);

  const tracks = selectedPlaylist?.tracks ?? [];
  const currentTrack = useMemo(() => tracks[currentIndex] ?? null, [tracks, currentIndex]);
  const currentSrc = useMemo(() => {
    if (!currentTrack) return null;
    return resolveTrackSrc(currentTrack, selectedPlaylist?.basePath);
  }, [currentTrack, selectedPlaylist?.basePath]);

  const jsonCurrentCover = useMemo(() => {
    if (!currentTrack) return null;
    return resolveTrackCover(currentTrack, selectedPlaylist?.basePath);
  }, [currentTrack, selectedPlaylist?.basePath]);

  const currentCover = useMemo(() => {
    if (jsonCurrentCover) return jsonCurrentCover;
    if (!currentSrc) return null;
    return embeddedCovers[currentSrc] ?? null;
  }, [jsonCurrentCover, currentSrc, embeddedCovers]);

  const isEmbeddedCurrentCover = Boolean(currentCover && !jsonCurrentCover);

  const canPlay = Boolean(currentSrc);
  const accentSoft = `rgba(${ACCENT.rgb}, 0.12)`;
  const accentBorder = `rgba(${ACCENT.rgb}, 0.22)`;
  const accentGlow = `rgba(${ACCENT.rgb}, 0.45)`;

  const progress = duration ? (currentTime / duration) * 100 : 0;
  const volumeFill = volume * 100;
  const progressGradient = `linear-gradient(to right, ${ACCENT.color} 0%, ${ACCENT.color} ${progress}%, rgba(255,255,255,0.12) ${progress}%, rgba(255,255,255,0.12) 100%)`;
  const volumeGradient = `linear-gradient(to right, ${ACCENT.color} 0%, ${ACCENT.color} ${volumeFill}%, rgba(255,255,255,0.12) ${volumeFill}%, rgba(255,255,255,0.12) 100%)`;

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE.isOpen, JSON.stringify(isOpen));
  }, [isOpen]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE.playlistId, selectedPlaylistId);
  }, [selectedPlaylistId]);

  useEffect(() => {
    if (!playlists.length) return;
    if (playlists.some((p) => p.id === selectedPlaylistId)) return;
    setSelectedPlaylistId(playlists[0]?.id ?? "playlist1");
  }, [playlists, selectedPlaylistId]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const candidates = [
        "/assets/music/library.json",
        "/assets/music/index.json",
        "/assets/music/manifest.json",
        "/assets/music/playlist1/library.json",
        "/assets/music/playlist1/index.json",
        "/assets/music/playlist1/manifest.json",
      ];

      for (const url of candidates) {
        const data = await tryFetchJson(url);
        const coerced = coerceLibrary(data);
        if (cancelled) return;
        if (coerced) {
          setLibrary(coerced);
          return;
        }
      }

      if (!cancelled) setLibrary({ playlists: [] });
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;
  }, [volume, currentSrc, shouldRenderPlayer]);

  useEffect(() => {
    if (!shouldRenderPlayer) {
      const audio = audioRef.current;
      if (audio) audio.pause();
      setIsPlaying(false);
      setIsOpen(false);
      setActivePanel(null);
    }
  }, [shouldRenderPlayer]);

  useEffect(() => {
    if (!tracks.length) {
      setCurrentIndex(0);
      setDuration(0);
      setCurrentTime(0);
      return;
    }
    setCurrentIndex((prev) => Math.min(prev, tracks.length - 1));
  }, [tracks.length]);

  useEffect(() => {
    if (!currentSrc || jsonCurrentCover || embeddedCovers[currentSrc] !== undefined) return;

    let cancelled = false;

    extractEmbeddedCover(currentSrc).then((cover) => {
      if (cancelled) return;
      setEmbeddedCovers((prev) => {
        if (prev[currentSrc] !== undefined) return prev;
        return { ...prev, [currentSrc]: cover };
      });
    });

    return () => {
      cancelled = true;
    };
  }, [currentSrc, jsonCurrentCover, embeddedCovers]);

  useEffect(() => {
    if (activePanel !== "queue") return;

    const missingSources = tracks
      .map((track) => {
        const jsonCover = resolveTrackCover(track, selectedPlaylist?.basePath);
        const src = resolveTrackSrc(track, selectedPlaylist?.basePath);

        if (jsonCover || !src) return null;
        if (embeddedCovers[src] !== undefined) return null;
        return src;
      })
      .filter(Boolean) as string[];

    if (!missingSources.length) return;

    let cancelled = false;

    const preload = async () => {
      for (const src of missingSources) {
        const cover = await extractEmbeddedCover(src);
        if (cancelled) return;

        setEmbeddedCovers((prev) => {
          if (prev[src] !== undefined) return prev;
          return { ...prev, [src]: cover };
        });
      }
    };

    void preload();

    return () => {
      cancelled = true;
    };
  }, [activePanel, tracks, selectedPlaylist?.basePath, embeddedCovers]);

  const togglePanel = (panel: ActivePanel) => {
    setActivePanel((prev) => (prev === panel ? null : panel));
  };

  const cycleLoopMode = () => {
    setLoopMode((prev) => (prev === "one" ? "all" : "one"));
  };

  const syncPlayState = async (nextPlaying: boolean) => {
    const audio = audioRef.current;
    if (!audio || !canPlay) return;

    if (nextPlaying) {
      try {
        await audio.play();
        setIsPlaying(true);
      } catch {
        setIsPlaying(false);
      }
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  };

  const getNextIndex = () => {
    if (!tracks.length) return 0;
    return isShuffle ? pickRandomIndex(tracks.length, currentIndex) : (currentIndex + 1) % tracks.length;
  };

  const getPrevIndex = () => {
    if (!tracks.length) return 0;
    return isShuffle ? pickRandomIndex(tracks.length, currentIndex) : (currentIndex - 1 + tracks.length) % tracks.length;
  };

  const handleTrackChange = (nextIndex: number) => {
    if (!tracks.length) return;

    const audio = audioRef.current;
    const wasPlaying = isPlaying;

    setCurrentIndex(nextIndex);
    setCurrentTime(0);
    setDuration(0);
    setActivePanel(null);

    requestAnimationFrame(async () => {
      const currentAudio = audioRef.current ?? audio;
      if (!currentAudio) return;
      currentAudio.load();
      currentAudio.currentTime = 0;
      currentAudio.volume = volume;

      if (wasPlaying) {
        try {
          await currentAudio.play();
          setIsPlaying(true);
        } catch {
          setIsPlaying(false);
        }
      }
    });
  };

  const nextTrack = () => handleTrackChange(getNextIndex());
  const prevTrack = () => handleTrackChange(getPrevIndex());

  const handleEnded = async () => {
    if (!tracks.length) return;

    if (isShuffle) {
      handleTrackChange(pickRandomIndex(tracks.length, currentIndex));
      return;
    }

    if (loopMode === "one") {
      const audio = audioRef.current;
      if (!audio) return;
      audio.currentTime = 0;
      try {
        await audio.play();
        setIsPlaying(true);
      } catch {
        setIsPlaying(false);
      }
      return;
    }

    handleTrackChange((currentIndex + 1) % tracks.length);
  };

  const handleToggleOpen = () => {
    setIsOpen((prev) => {
      const next = !prev;
      if (!next) setActivePanel(null);
      return next;
    });
  };

  const handlePlaylistChange = (nextPlaylistId: string) => {
    if (!nextPlaylistId || nextPlaylistId === selectedPlaylistId) return;

    const wasPlaying = isPlaying;

    setSelectedPlaylistId(nextPlaylistId);
    setCurrentIndex(0);
    setCurrentTime(0);
    setDuration(0);

    requestAnimationFrame(async () => {
      const audio = audioRef.current;
      if (!audio) return;
      audio.load();
      audio.currentTime = 0;
      audio.volume = volume;

      if (wasPlaying) {
        try {
          await audio.play();
          setIsPlaying(true);
        } catch {
          setIsPlaying(false);
        }
      }
    });
  };

  if (!shouldRenderPlayer) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      <style>{`
        .mw-no-scrollbar::-webkit-scrollbar { display: none; }
        .mw-no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

        /*
          Mobile landscape safety:
          - Phones in landscape can hit the sm breakpoint (wide) but have very little height.
          - Keep the player within viewport and prevent the toggle button from becoming unreachable.
        */
        .mw-panel {
          max-height: calc(100dvh - 7rem);
          overflow-y: auto;
          overscroll-behavior: contain;
        }
        @media (orientation: landscape) and (max-height: 520px) {
          .mw-panel {
            left: 0.75rem !important;
            right: 0.75rem !important;
            bottom: 4.5rem !important;
            width: auto !important;
            transform: none !important;
          }
        }

        .mw-slider {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 6px;
          border-radius: 999px;
          outline: none;
          background: rgba(255,255,255,0.12);
          cursor: pointer;
        }
        .mw-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 999px;
          border: 2px solid rgba(10, 18, 22, 0.9);
          background: ${ACCENT.color};
          box-shadow: 0 0 14px rgba(${ACCENT.rgb}, 0.55);
        }
        .mw-slider::-moz-range-thumb {
          width: 14px;
          height: 14px;
          border-radius: 999px;
          border: 2px solid rgba(10, 18, 22, 0.9);
          background: ${ACCENT.color};
          box-shadow: 0 0 14px rgba(${ACCENT.rgb}, 0.55);
        }
        .mw-queue-scroll::-webkit-scrollbar { width: 6px; }
        .mw-queue-scroll::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.12);
          border-radius: 999px;
        }
      `}</style>

      <div className="pointer-events-auto absolute bottom-4 left-4">
        <button
          type="button"
          onClick={handleToggleOpen}
          className="flex items-center gap-2 rounded-full border border-white/10 bg-[#091317]/85 px-3 py-2 text-xs text-white/80 shadow-[0_18px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl"
          aria-label={isOpen ? "Cerrar música" : "Abrir música"}
        >
          <LuMusic2 className="h-4 w-4" style={{ color: ACCENT.color }} />
          <span className="hidden sm:inline">Música</span>
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.985 }}
            transition={{ duration: 0.2 }}
            className="mw-panel mw-no-scrollbar pointer-events-auto absolute bottom-20 left-3 right-3 rounded-[1.45rem] border border-white/10 bg-[#091317]/80 px-4 py-4 text-white shadow-[0_22px_70px_rgba(0,0,0,0.52)] backdrop-blur-2xl sm:bottom-4 sm:left-1/2 sm:right-auto sm:w-[min(94vw,920px)] sm:-translate-x-1/2 sm:rounded-[1.6rem] sm:px-5"
            style={{ boxShadow: `0 22px 70px rgba(0,0,0,0.52), 0 0 0 1px rgba(255,255,255,0.04), 0 0 30px rgba(${ACCENT.rgb}, 0.08)` }}
          >
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                  {currentCover ? (
                    <motion.img
                      key={currentCover}
                      src={currentCover}
                      alt={currentTrack?.title ?? "cover"}
                      initial={{ opacity: 0.4, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.25 }}
                      className={`h-12 w-12 shrink-0 rounded-2xl ring-1 ring-white/10 sm:h-14 sm:w-14 ${
                        isEmbeddedCurrentCover ? "bg-[#0b171c] p-1 object-contain" : "object-cover"
                      }`}
                    />
                  ) : (
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ring-1 ring-white/10 sm:h-14 sm:w-14"
                      style={{ backgroundColor: accentSoft }}
                    >
                      <LuMusic2 className="h-5 w-5" style={{ color: ACCENT.color }} />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="mb-1.5 flex items-center gap-2 text-[10px] uppercase tracking-[0.22em]" style={{ color: `rgba(${ACCENT.rgb}, 0.82)` }}>
                      <LuMusic2 className="h-3.5 w-3.5" style={{ color: ACCENT.color }} />
                      Música
                    </div>
                    <p className="truncate text-sm font-semibold sm:text-base md:text-lg">
                      {currentTrack?.title ?? (tracks.length ? "Sin título" : "Sin tracks")}
                    </p>
                    <p className="truncate text-xs text-white/60 sm:text-sm">{currentTrack?.artist ?? ""}</p>
                  </div>
                </div>

                <div className="w-full md:w-auto">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 md:justify-end">
                    <button
                      onClick={prevTrack}
                      className="rounded-full border border-white/10 bg-white/5 p-2 transition hover:bg-white/10 disabled:opacity-50"
                      aria-label="Anterior"
                      disabled={!tracks.length}
                      type="button"
                    >
                      <LuSkipBack className="h-4 w-4" />
                    </button>

                    <button
                      onClick={() => syncPlayState(!isPlaying)}
                      className="flex h-9 w-9 items-center justify-center rounded-full border transition hover:scale-[1.03] disabled:opacity-50 sm:h-10 sm:w-10"
                      style={{
                        borderColor: accentBorder,
                        backgroundColor: accentSoft,
                        color: ACCENT.color,
                        boxShadow: `0 0 18px rgba(${ACCENT.rgb}, 0.12)`,
                      }}
                      aria-label={isPlaying ? "Pausar" : "Reproducir"}
                      disabled={!canPlay}
                      type="button"
                    >
                      {isPlaying ? <LuPause className="h-4 w-4" /> : <LuPlay className="ml-0.5 h-4 w-4" />}
                    </button>

                    <button
                      onClick={nextTrack}
                      className="rounded-full border border-white/10 bg-white/5 p-2 transition hover:bg-white/10 disabled:opacity-50"
                      aria-label="Siguiente"
                      disabled={!tracks.length}
                      type="button"
                    >
                      <LuSkipForward className="h-4 w-4" />
                    </button>

                    <button
                      onClick={cycleLoopMode}
                      className="rounded-full border p-2 transition hover:bg-white/10"
                      style={{ borderColor: accentBorder, backgroundColor: accentSoft, color: ACCENT.color }}
                      aria-label={loopMode === "one" ? "Bucle canción" : "Bucle playlist"}
                      type="button"
                    >
                      {loopMode === "one" ? <LuRepeat1 className="h-4 w-4" /> : <LuRepeat className="h-4 w-4" />}
                    </button>

                    <button
                      onClick={() => setIsShuffle((prev) => !prev)}
                      className="rounded-full border p-2 transition hover:bg-white/10"
                      style={
                        isShuffle
                          ? { borderColor: accentBorder, backgroundColor: accentSoft, color: ACCENT.color }
                          : { borderColor: "rgba(255,255,255,0.10)", backgroundColor: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.75)" }
                      }
                      aria-label="Mezcla aleatoria"
                      type="button"
                    >
                      <LuShuffle className="h-4 w-4" />
                    </button>

                    <div className="mx-1 h-5 w-px shrink-0 bg-white/10 sm:h-6" />

                    <div className="relative">
                      <button
                        onClick={() => togglePanel("volume")}
                        className="rounded-full border p-2 transition hover:bg-white/10"
                        style={
                          activePanel === "volume"
                            ? { borderColor: accentBorder, backgroundColor: accentSoft, color: ACCENT.color }
                            : { borderColor: "rgba(255,255,255,0.10)", backgroundColor: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.75)" }
                        }
                        aria-label="Volumen"
                        type="button"
                      >
                        <LuVolume2 className="h-4 w-4" />
                      </button>

                      <AnimatePresence>
                        {activePanel === "volume" && (
                          <motion.div
                            initial={{ opacity: 0, y: 6, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 6, scale: 0.98 }}
                            transition={{ duration: 0.18 }}
                            className="absolute bottom-[calc(100%+12px)] right-0 z-30 w-56 max-w-[calc(100vw-2rem)] rounded-2xl border border-white/10 bg-[#0b171c]/96 p-3 shadow-2xl backdrop-blur-2xl sm:w-64 sm:max-w-[calc(100vw-3rem)]"
                            style={{ boxShadow: `0 18px 40px rgba(0,0,0,0.42), 0 0 24px rgba(${ACCENT.rgb}, 0.08)` }}
                          >
                            <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.18em]" style={{ color: "rgba(255,255,255,0.45)" }}>
                              <span>Volumen</span>
                              <span style={{ color: ACCENT.color }}>{Math.round(volume * 100)}%</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <LuVolume2 className="h-4 w-4 shrink-0 text-white/65" />
                              <input
                                className="mw-slider"
                                type="range"
                                min={0}
                                max={1}
                                step={0.01}
                                value={volume}
                                onChange={(e) => setVolume(Number(e.target.value))}
                                aria-label="Volumen"
                                style={{ background: volumeGradient }}
                              />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <button
                      onClick={() => togglePanel("queue")}
                      className="inline-flex items-center gap-2 rounded-full border px-2.5 py-2 text-xs font-medium transition hover:bg-white/10 sm:px-3 sm:text-[13px]"
                      style={
                        activePanel === "queue"
                          ? { borderColor: accentBorder, backgroundColor: accentSoft, color: ACCENT.color }
                          : { borderColor: "rgba(255,255,255,0.10)", backgroundColor: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.75)" }
                      }
                      aria-label="Cola"
                      type="button"
                    >
                      <LuListMusic className="h-4 w-4" />
                      <span className="hidden sm:inline">Cola</span>
                      <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] text-white/60">{tracks.length}</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <span className="w-9 shrink-0 text-[10px] text-white/45 sm:w-10 sm:text-[11px]">{formatTime(currentTime)}</span>
                <input
                  className="mw-slider"
                  type="range"
                  min={0}
                  max={duration || 0}
                  step={0.1}
                  value={currentTime}
                  aria-label="Progreso"
                  onChange={(e) => {
                    const next = Number(e.target.value);
                    setCurrentTime(next);
                    if (audioRef.current) audioRef.current.currentTime = next;
                  }}
                  style={{ background: progressGradient }}
                />
                <span className="w-9 shrink-0 text-right text-[10px] text-white/45 sm:w-10 sm:text-[11px]">{formatTime(duration)}</span>
              </div>

              <AnimatePresence>
                {activePanel === "queue" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden border-t border-white/10 pt-3"
                  >
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2 px-1">
                      <div className="text-[10px] uppercase tracking-[0.2em] text-white/45 sm:text-[11px]">Cola</div>
                      <div className="flex items-center gap-2">
                        {playlists.length > 1 && (
                          <select
                            value={selectedPlaylist?.id ?? selectedPlaylistId}
                            onChange={(e) => handlePlaylistChange(e.target.value)}
                            className="rounded-xl border border-white/10 bg-[#0b171c] px-2.5 py-1 text-[11px] text-white/80 outline-none transition focus:border-white/20"
                            style={{ backgroundColor: "#0b171c", color: "rgba(255,255,255,0.82)" }}
                            aria-label="Seleccionar playlist"
                          >
                            {playlists.map((p) => (
                              <option key={p.id} value={p.id} style={{ backgroundColor: "#0b171c", color: "#ffffff" }}>
                                {p.name}
                              </option>
                            ))}
                          </select>
                        )}
                        <div className="text-[10px] text-white/35 sm:text-[11px]">{tracks.length} canciones</div>
                      </div>
                    </div>

                    <div
                      className={
                        tracks.length > 3
                          ? "mw-queue-scroll max-h-52 overflow-y-auto pr-1"
                          : "pr-1"
                      }
                    >
                      {tracks.map((track, index) => {
                        const active = index === currentIndex;
                        const resolvedSrc = resolveTrackSrc(track, selectedPlaylist?.basePath);
                        const resolvedJsonCover = resolveTrackCover(track, selectedPlaylist?.basePath);
                        const cover = resolvedJsonCover ?? (resolvedSrc ? embeddedCovers[resolvedSrc] ?? null : null);
                        const isEmbeddedCover = Boolean(cover && !resolvedJsonCover);

                        return (
                          <button
                            key={`${track.title}-${index}`}
                            type="button"
                            onClick={() => handleTrackChange(index)}
                            className={`flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition ${active ? "bg-white/[0.05]" : "hover:bg-white/[0.03]"}`}
                          >
                            {cover ? (
                              <img src={cover} alt={track.title} className={`h-10 w-10 shrink-0 rounded-xl ${
                                  isEmbeddedCover ? "bg-[#0b171c] p-1 object-contain" : "object-cover"
                                }`} />
                            ) : (
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5">
                                <LuMusic2 className="h-4 w-4 text-white/60" />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-sm font-medium text-white">{track.title}</div>
                              <div className="truncate text-xs text-white/45">{track.artist ?? ""}</div>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                              {active && <div className="h-2 w-2 rounded-full" style={{ backgroundColor: ACCENT.color, boxShadow: `0 0 10px ${accentGlow}` }} />}
                              <span className="text-[10px] uppercase tracking-[0.14em] text-white/30">{active ? "Now" : "Play"}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <audio
        ref={audioRef}
        src={currentSrc ?? undefined}
        preload="metadata"
        onLoadedMetadata={(e) => {
          const audio = e.currentTarget;
          const nextDuration = audio.duration || 0;
          setDuration(nextDuration);

          if (currentTime > 0) {
            const safeTime = nextDuration > 0 ? Math.min(currentTime, Math.max(0, nextDuration - 0.25)) : currentTime;
            if (Math.abs(audio.currentTime - safeTime) > 0.15) {
              audio.currentTime = safeTime;
            }
          }

          audio.volume = volume;
        }}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onEnded={handleEnded}
      />
    </div>
  );
}
