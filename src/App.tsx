import { useEffect, useRef } from "react";
import { AppShell } from "./components/shell/AppShell";
import { useThemeStore } from "./store/themeStore";
import { useLibraryStore, loadUserLibraryFromStorage } from "./store/libraryStore";
import { useProjectStore } from "./store/projectStore";
import { loadBuiltInLibraries } from "./lib/symbolLoader";
import { autosaveProject, loadAutosave } from "./lib/projectIO";

export default function App() {
  const theme = useThemeStore((s) => s.theme);
  const setLibraries = useLibraryStore((s) => s.setLibraries);
  const setUserLibrarySymbols = useLibraryStore((s) => s.setUserLibrarySymbols);
  const setProject = useProjectStore((s) => s.setProject);
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Load built-in libraries + restore user library from storage
  useEffect(() => {
    const builtIn = loadBuiltInLibraries();
    setLibraries(builtIn);
    // After built-in libs are set, inject saved user symbols
    const saved = loadUserLibraryFromStorage();
    if (saved.length > 0) {
      setUserLibrarySymbols(saved);
    }
  }, []);

  // Restore autosave on startup
  useEffect(() => {
    const saved = loadAutosave();
    if (!saved) return;
    const restore = window.confirm(
      "A saved session was found. Restore it?\n\nClick Cancel to start fresh."
    );
    if (restore) setProject(saved);
  }, []);

  // Autosave project on every change (debounced 800ms)
  useEffect(() => {
    return useProjectStore.subscribe((state) => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = setTimeout(() => {
        autosaveProject(state.project);
      }, 800);
    });
  }, []);

  return <AppShell />;
}
