import React, { useReducer } from "react";
import {
  initialMediaState,
  mediaReducer,
  mediaStateKey,
  type MediaInput,
} from "@/lib/transmissionMedia";

type Props = MediaInput & { alt: string; className?: string };

function MediaContent({ alt, className = "", poster, ...input }: Props) {
  const [state, dispatch] = useReducer(mediaReducer, { ...input, poster }, initialMediaState);
  const current = state.candidates[state.index];
  return (
    <div className={className} data-media-status={state.status}>
      {state.status !== "failed" && current && (
        current.kind === "video" ? (
          <video
            key={current.src}
            src={current.src}
            poster={poster || input.fallback || undefined}
            muted loop autoPlay playsInline controls
            preload="metadata"
            aria-label={alt}
            onLoadedData={() => dispatch("loaded")}
            onError={() => dispatch("error")}
          />
        ) : (
          <img
            key={current.src}
            src={current.src}
            alt={alt}
            onLoad={() => dispatch("loaded")}
            onError={() => dispatch("error")}
          />
        )
      )}
      {state.status === "failed" && (
        <span className="image-fallback" role="status">IMAGE<br />SIGNAL<br />LOST</span>
      )}
    </div>
  );
}

export function TransmissionMedia(props: Props) {
  // Changing the selected CMS/weekly source remounts only the media state.
  // An old failed image cannot keep a newly uploaded image hidden.
  return <MediaContent key={mediaStateKey(props)} {...props} />;
}
