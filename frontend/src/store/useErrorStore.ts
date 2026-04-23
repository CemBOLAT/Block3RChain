import { create } from "zustand";

interface ErrorState {
  isOpen: boolean;
  message: string;
  title: string;
  showError: (message: string, title?: string) => void;
  closeError: () => void;
}

export const useErrorStore = create<ErrorState>((set) => ({
  isOpen: false,
  message: "",
  title: "Error",
  showError: (message, title = "System Error") =>
    set({ isOpen: true, message, title }),
  closeError: () => set({ isOpen: false }),
}));
