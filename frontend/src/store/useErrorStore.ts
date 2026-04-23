import { create } from "zustand";

interface ErrorState {
  isOpen: boolean;
  message: string;
  title: string;
  showCloseButton: boolean;
  showError: (message: string, title?: string, showCloseButton?: boolean) => void;
  closeError: () => void;
}

export const useErrorStore = create<ErrorState>((set) => ({
  isOpen: false,
  message: "",
  title: "Error",
  showCloseButton: true,
  showError: (message, title = "System Error", showCloseButton = true) =>
    set({ isOpen: true, message, title, showCloseButton }),
  closeError: () => set({ isOpen: false }),
}));
