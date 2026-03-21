import { create } from 'zustand';

type AppState = {
  spinSpeed: number
}

export const useAppStore = create<AppState>(() => ({
  spinSpeed: 1,
}));
