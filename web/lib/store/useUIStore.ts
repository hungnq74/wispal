"use client";

import { create } from "zustand";

export type Overlay = "none" | "shop" | "journal" | "settings" | "quests" | "ambience" | "recall" | "rooms" | "companions";

interface UIState {
  overlay: Overlay;
  toast: string | null;
  openOverlay: (o: Overlay) => void;
  closeOverlay: () => void;
  flash: (msg: string) => void;
  clearToast: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  overlay: "none",
  toast: null,
  openOverlay: (overlay) => set({ overlay }),
  closeOverlay: () => set({ overlay: "none" }),
  flash: (toast) => set({ toast }),
  clearToast: () => set({ toast: null }),
}));
