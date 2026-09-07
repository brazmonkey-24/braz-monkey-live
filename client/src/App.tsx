// Signal Zine direction: the app is a single broadcast sheet with dark editorial framing, anchor navigation, and explicit transmission routes.
import Home from "./pages/Home";
import Admin from "./pages/Admin";

export default function App() {
  if (typeof window !== "undefined" && window.location.pathname === "/admin") {
    return <Admin />;
  }
  return <Home />;
}
