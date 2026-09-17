// Signal Zine direction: the app is a full broadcast site with a homepage hub and dedicated transmission pages.
import Home from "./pages/Home";
import Admin from "./pages/Admin";
import Media from "./pages/Media";
import { ArchivePage, BlackbookPage, CmsPostPage, FollowPage, OriginPage, TelemetryPage, TransmissionsPage } from "./pages/SignalPages";
import CursorFollower from "./components/CursorFollower";

export default function App() {
  const path = typeof window !== "undefined" ? window.location.pathname.replace(/\/$/, "") || "/" : "/";
  const cmsPostMatch = path.match(/^\/archive\/post\/(\d+)$/);
  const page = cmsPostMatch ? <CmsPostPage id={Number(cmsPostMatch[1])} />
    : path === "/admin" ? <Admin />
    : path === "/media" ? <Media />
    : path === "/transmissions" ? <TransmissionsPage />
    : path === "/telemetry" ? <TelemetryPage />
    : path === "/origin" ? <OriginPage />
    : path === "/archive" ? <ArchivePage />
    : path === "/follow" ? <FollowPage />
    : path === "/blackbook" ? <BlackbookPage />
    : <Home />;
  return <><CursorFollower />{page}</>;
}
