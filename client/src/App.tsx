// Signal Zine direction: the app is a full broadcast site with a homepage hub and dedicated transmission pages.
import Home from "./pages/Home";
import Admin from "./pages/Admin";
import Media from "./pages/Media";
import { ArchivePage, BlackbookPage, FollowPage, OriginPage, TelemetryPage, TransmissionsPage } from "./pages/SignalPages";

export default function App() {
  const path = typeof window !== "undefined" ? window.location.pathname.replace(/\/$/, "") || "/" : "/";
  if (path === "/admin") return <Admin />;
  if (path === "/media") return <Media />;
  if (path === "/transmissions") return <TransmissionsPage />;
  if (path === "/telemetry") return <TelemetryPage />;
  if (path === "/origin") return <OriginPage />;
  if (path === "/archive") return <ArchivePage />;
  if (path === "/follow") return <FollowPage />;
  if (path === "/blackbook") return <BlackbookPage />;
  return <Home />;
}
