import { create } from 'zustand';

interface UIState {
  isHandVisible: boolean;
  setHandVisible: (visible: boolean) => void;
  isScrollLocked: boolean;
  setScrollLocked: (locked: boolean) => void;
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
  isModelReady: boolean;
  setModelReady: (ready: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isHandVisible: true,
  setHandVisible: (visible) => set({ isHandVisible: visible }),
  isScrollLocked: false,
  setScrollLocked: (locked) => set({ isScrollLocked: locked }),
  isLoading: true,
  setLoading: (loading) => set({ isLoading: loading }),
  isModelReady: false,
  setModelReady: (ready) => set({ isModelReady: ready }),
}));
