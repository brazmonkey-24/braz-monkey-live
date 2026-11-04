export type MediaKind = "image" | "video";
export type MediaCandidate = { src: string; kind: MediaKind };
export type MediaState = {
  candidates: MediaCandidate[];
  index: number;
  status: "loading" | "ready" | "failed";
};
export type MediaInput = {
  source?: string | null;
  kind?: MediaKind;
  poster?: string | null;
  fallback?: string | null;
};

export function mediaCandidates({ source, kind = "image", poster, fallback }: MediaInput): MediaCandidate[] {
  const candidates: MediaCandidate[] = [];
  const append = (src: string | null | undefined, type: MediaKind) => {
    if (src?.trim() && !candidates.some((candidate) => candidate.src === src)) {
      candidates.push({ src, kind: type });
    }
  };
  append(source, kind);
  append(poster, "image");
  append(fallback, "image");
  return candidates;
}

export function initialMediaState(input: MediaInput): MediaState {
  const candidates = mediaCandidates(input);
  return { candidates, index: 0, status: candidates.length ? "loading" : "failed" };
}

export function mediaStateKey(input: MediaInput): string {
  return JSON.stringify(mediaCandidates(input));
}

export function mediaReducer(state: MediaState, action: "loaded" | "error"): MediaState {
  if (state.status === "failed") return state;
  if (action === "loaded") return { ...state, status: "ready" };
  const index = state.index + 1;
  return {
    ...state,
    index,
    status: index < state.candidates.length ? "loading" : "failed",
  };
}
