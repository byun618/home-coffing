import { create } from "zustand";

interface SuccessAlert {
  id: number;
  title: string;
  subtitle: string;
}

interface AlertState {
  current: SuccessAlert | null;
  show: (title: string, subtitle: string) => void;
  dismiss: () => void;
}

let nextId = 1;
let timer: ReturnType<typeof setTimeout> | null = null;

export const useAlertStore = create<AlertState>((set) => ({
  current: null,
  show(title, subtitle) {
    if (timer) clearTimeout(timer);
    const id = nextId++;
    set({ current: { id, title, subtitle } });
    timer = setTimeout(() => {
      set((state) =>
        state.current?.id === id ? { current: null } : state,
      );
    }, 2000);
  },
  dismiss() {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    set({ current: null });
  },
}));

export function showSuccess(title: string, subtitle: string): void {
  useAlertStore.getState().show(title, subtitle);
}
