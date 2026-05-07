import { create } from "zustand";
import type { SymbolDefinition } from "../models/symbol";
import type { SymbolLibrary } from "../models/project";

const USER_LIB_KEY = "ss_user_library_v1";

export function saveUserLibraryToStorage(symbols: SymbolDefinition[]): void {
  try { localStorage.setItem(USER_LIB_KEY, JSON.stringify(symbols)); } catch {}
}
export function loadUserLibraryFromStorage(): SymbolDefinition[] {
  try {
    const raw = localStorage.getItem(USER_LIB_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SymbolDefinition[];
  } catch { return []; }
}

interface LibraryState {
  libraries: SymbolLibrary[];
  selectedLibraryId: string | null;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  setLibraries: (libs: SymbolLibrary[]) => void;
  addSymbolToUserLibrary: (symbol: SymbolDefinition) => void;
  setUserLibrarySymbols: (symbols: SymbolDefinition[]) => void;
  getFilteredSymbols: () => SymbolDefinition[];
  getSymbolById: (id: string) => SymbolDefinition | undefined;
}

export const useLibraryStore = create<LibraryState>()((set, get) => ({
  libraries: [],
  selectedLibraryId: null,
  searchQuery: "",

  setSearchQuery: (searchQuery) => set({ searchQuery }),

  setLibraries: (libraries) => set({ libraries }),

  addSymbolToUserLibrary: (symbol) => {
    set((state) => {
      const userLib = state.libraries.find((l) => !l.isBuiltIn);
      if (!userLib) return state;
      const newLibs = state.libraries.map((l) =>
        l.id === userLib.id ? { ...l, symbols: [...l.symbols, symbol] } : l
      );
      const newUserLib = newLibs.find((l) => !l.isBuiltIn);
      if (newUserLib) saveUserLibraryToStorage(newUserLib.symbols);
      return { libraries: newLibs };
    });
  },

  setUserLibrarySymbols: (symbols) => {
    set((state) => {
      const userLib = state.libraries.find((l) => !l.isBuiltIn);
      if (!userLib) return state;
      return {
        libraries: state.libraries.map((l) =>
          l.id === userLib.id ? { ...l, symbols } : l
        ),
      };
    });
  },

  getFilteredSymbols: () => {
    const { libraries, searchQuery } = get();
    const all = libraries.flatMap((l) => l.symbols);
    if (!searchQuery.trim()) return all;
    const q = searchQuery.toLowerCase();
    return all.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.tags.some((t) => t.toLowerCase().includes(q))
    );
  },

  getSymbolById: (id) => {
    return get().libraries.flatMap((l) => l.symbols).find((s) => s.id === id);
  },
}));
