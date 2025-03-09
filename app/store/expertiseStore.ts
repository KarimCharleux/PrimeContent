import { create } from 'zustand';

interface ExpertiseStore {
  activeCard: string | null;
  setActiveCard: (title: string | null) => void;
}

export const useExpertiseStore = create<ExpertiseStore>((set) => ({
  activeCard: null,
  setActiveCard: (title) => set({ activeCard: title }),
})); 