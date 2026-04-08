import { create } from "zustand";

type SheetKind = "addBean" | "consume" | null;

interface SheetStore {
  open: SheetKind;
  show: (kind: Exclude<SheetKind, null>) => void;
  close: () => void;
}

export const useSheetStore = create<SheetStore>((set) => ({
  open: null,
  show: (kind) => set({ open: kind }),
  close: () => set({ open: null }),
}));
