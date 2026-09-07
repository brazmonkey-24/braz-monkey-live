// Signal Zine direction: the app is a single broadcast sheet with dark editorial framing, anchor navigation, and explicit transmission routes.
import Home from "./pages/Home";
import Admin from "./pages/Admin";
import Media from "./pages/Media";

export default function App() {
  if (typeof window !== "undefined" && window.location.pathname === "/admin") {
    return <Admin />;
  }
  if (typeof window !== "undefined" && window.location.pathname === "/media") {
    return <Media />;
  }
  return <Home />;
}
