import { create } from "zustand";

export interface Command {
  description: string;
  execute: () => void;
  undo: () => void;
}

const MAX_HISTORY = 100;

interface HistoryState {
  past: Command[];
  future: Command[];
  canUndo: boolean;
  canRedo: boolean;
  execute: (cmd: Command) => void;
  undo: () => void;
  redo: () => void;
  clear: () => void;
}

export const useHistoryStore = create<HistoryState>()((set, get) => ({
  past: [],
  future: [],
  canUndo: false,
  canRedo: false,

  execute: (cmd) => {
    cmd.execute();
    set((state) => {
      const past = [...state.past, cmd].slice(-MAX_HISTORY);
      return { past, future: [], canUndo: true, canRedo: false };
    });
  },

  undo: () => {
    const { past } = get();
    if (!past.length) return;
    const cmd = past[past.length - 1];
    cmd.undo();
    set((state) => {
      const newPast = state.past.slice(0, -1);
      const newFuture = [cmd, ...state.future];
      return { past: newPast, future: newFuture, canUndo: newPast.length > 0, canRedo: true };
    });
  },

  redo: () => {
    const { future } = get();
    if (!future.length) return;
    const cmd = future[0];
    cmd.execute();
    set((state) => {
      const newPast = [...state.past, cmd].slice(-MAX_HISTORY);
      const newFuture = state.future.slice(1);
      return { past: newPast, future: newFuture, canUndo: true, canRedo: newFuture.length > 0 };
    });
  },

  clear: () => set({ past: [], future: [], canUndo: false, canRedo: false }),
}));
