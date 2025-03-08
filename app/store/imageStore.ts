import { create } from 'zustand';

interface ImageStore {
  preloadedImages: HTMLImageElement[];
  setPreloadedImages: (images: HTMLImageElement[]) => void;
}

export const useImageStore = create<ImageStore>((set) => ({
  preloadedImages: [],
  setPreloadedImages: (images) => set({ preloadedImages: images }),
})); 