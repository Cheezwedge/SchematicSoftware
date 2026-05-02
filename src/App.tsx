import { useEffect } from "react";
import { AppShell } from "./components/shell/AppShell";
import { useThemeStore } from "./store/themeStore";
import { useLibraryStore } from "./store/libraryStore";
import { loadBuiltInLibraries } from "./lib/symbolLoader";

export default function App() {
  const theme = useThemeStore((s) => s.theme);
  const setLibraries = useLibraryStore((s) => s.setLibraries);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    setLibraries(loadBuiltInLibraries());
  }, []);

  return <AppShell />;
}
