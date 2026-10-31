import { create } from "zustand";

interface CartUiState {
  isDrawerOpen: boolean;
  isDragging: boolean;
  isOverDropZone: boolean;
  /** Incremented on every successful add so the hive can replay its "gulp" animation. */
  addPulse: number;
  announcement: string;
  openDrawer: () => void;
  closeDrawer: () => void;
  setDragging: (isDragging: boolean) => void;
  setOverDropZone: (isOver: boolean) => void;
  notifyAdded: (message: string) => void;
}

export const useCartUiStore = create<CartUiState>()((set) => ({
  isDrawerOpen: false,
  isDragging: false,
  isOverDropZone: false,
  addPulse: 0,
  announcement: "",
  openDrawer: () => set({ isDrawerOpen: true }),
  closeDrawer: () => set({ isDrawerOpen: false }),
  setDragging: (isDragging) => set(isDragging ? { isDragging } : { isDragging, isOverDropZone: false }),
  setOverDropZone: (isOverDropZone) => set({ isOverDropZone }),
  notifyAdded: (announcement) => set(({ addPulse }) => ({ addPulse: addPulse + 1, announcement })),
}));
