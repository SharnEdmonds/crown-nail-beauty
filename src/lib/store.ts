import { create } from 'zustand';

interface UIState {
  isHandVisible: boolean;
  setHandVisible: (visible: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isHandVisible: true,
  setHandVisible: (visible) => set({ isHandVisible: visible }),
}));
