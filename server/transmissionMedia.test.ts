import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { TransmissionMedia } from "../client/src/components/TransmissionMedia";
import { initialMediaState, mediaCandidates, mediaReducer, mediaStateKey } from "../client/src/lib/transmissionMedia";

const primary = "/manus-storage/transmissions/monday/weekly.png";
const poster = "/manus-storage/cms/monday.jpg";
const original = "/manus-storage/moondaymondaymorningquote_a499a598.jpg";

describe("weekly transmission media recovery", () => {
  it("does not show IMAGE SIGNAL LOST while a valid image is loading", () => {
    const html = renderToStaticMarkup(React.createElement(TransmissionMedia, {
      source: primary, poster, fallback: original, alt: "Monday signal", className: "card-image",
    }));
    expect(html).toContain('src="' + primary + '"');
    expect(html).toContain('data-media-status="loading"');
    expect(html).not.toContain('class="image-fallback"');
    expect(html).not.toContain("SIGNAL<br/>LOST");
  });
  it("marks a loaded image ready without displaying a false failure", () => {
    const ready = mediaReducer(initialMediaState({ source: primary, fallback: original }), "loaded");
    expect(ready.status).toBe("ready");
    expect(ready.candidates[ready.index].src).toBe(primary);
  });
  it("tries the CMS artwork then the authentic original after a weekly-image failure", () => {
    const one = mediaReducer(initialMediaState({ source: primary, poster, fallback: original }), "error");
    expect(one.status).toBe("loading");
    expect(one.candidates[one.index].src).toBe(poster);
    const two = mediaReducer(one, "error");
    expect(two.candidates[two.index].src).toBe(original);
    expect(mediaReducer(two, "loaded").status).toBe("ready");
  });
  it("only reports failure after every candidate fails and does not retry forever", () => {
    let state = initialMediaState({ source: primary, fallback: original });
    state = mediaReducer(mediaReducer(state, "error"), "error");
    expect(state.status).toBe("failed");
    expect(mediaReducer(state, "error")).toBe(state);
    expect(mediaReducer(state, "loaded")).toBe(state);
  });
  it("deduplicates missing and repeated artwork to bound retries", () => {
    expect(mediaCandidates({ source: "", poster: original, fallback: original })).toEqual([{ src: original, kind: "image" }]);
    expect(initialMediaState({}).status).toBe("failed");
  });
  it("changes the remount key and resets failed state when new CMS artwork arrives", () => {
    const old = { source: primary, fallback: original };
    const next = { source: "/manus-storage/cms/new-upload.png", fallback: original };
    expect(mediaStateKey(old)).not.toBe(mediaStateKey(next));
    expect(initialMediaState(next).status).toBe("loading");
    expect(initialMediaState(next).index).toBe(0);
    expect(mediaStateKey({ ...old, kind: "video" })).not.toBe(mediaStateKey(old));
  });
  it("preserves the video controls and falls back to artwork after video failure", () => {
    const input = { source: "/manus-storage/transmissions/friday/clip.mp4", kind: "video" as const, poster, fallback: original };
    const html = renderToStaticMarkup(React.createElement(TransmissionMedia, { ...input, alt: "Friday footage" }));
    expect(html).toContain("<video");
    expect(html).toContain('poster="' + poster + '"');
    expect(html).toContain("controls");
    expect(html).not.toContain('class="image-fallback"');
    const recovery = mediaReducer(initialMediaState(input), "error");
    expect(recovery.candidates[recovery.index]).toEqual({ src: poster, kind: "image" });
  });
  it("renders the real failure message when no artwork exists", () => {
    const html = renderToStaticMarkup(React.createElement(TransmissionMedia, { alt: "Unavailable signal" }));
    expect(html).toContain('data-media-status="failed"');
    expect(html).toContain('class="image-fallback"');
    expect(html).toContain('role="status"');
    expect(html).not.toContain("<img");
  });
});
