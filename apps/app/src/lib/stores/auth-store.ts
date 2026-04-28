import { create } from "zustand";

import { api } from "../api";
import { clearTokens, getTokens, saveTokens } from "../secure-storage";
import type { AuthTokensResponse, UserMe } from "../types";

type Status = "loading" | "authenticated" | "guest";

interface AuthState {
  status: Status;
  user: UserMe | null;
  activeCafeId: number | null;
  init: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
  setActiveCafe: (cafeId: number) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  status: "loading",
  user: null,
  activeCafeId: null,

  async init() {
    const { accessToken } = await getTokens();
    if (!accessToken) {
      set({ status: "guest", user: null, activeCafeId: null });
      return;
    }
    try {
      const me = await api.get<UserMe>("/me");
      set({
        status: "authenticated",
        user: me,
        activeCafeId: me.defaultCafeId ?? me.memberships[0]?.cafeId ?? null,
      });
    } catch {
      await clearTokens();
      set({ status: "guest", user: null, activeCafeId: null });
    }
  },

  async login(email, password) {
    const data = await api.post<AuthTokensResponse>(
      "/auth/login",
      { email, password },
      { auth: false },
    );
    await saveTokens({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    });
    await get().refreshMe();
  },

  async signup(email, password) {
    const data = await api.post<AuthTokensResponse>(
      "/auth/signup",
      { email, password },
      { auth: false },
    );
    await saveTokens({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    });
    await get().refreshMe();
  },

  async logout() {
    const { refreshToken } = await getTokens();
    if (refreshToken) {
      try {
        await api.post("/auth/logout", { refreshToken }, { auth: false });
      } catch {
        // server-side revoke 실패해도 로컬 토큰은 정리
      }
    }
    await clearTokens();
    set({ status: "guest", user: null, activeCafeId: null });
  },

  async refreshMe() {
    const me = await api.get<UserMe>("/me");
    set({
      status: "authenticated",
      user: me,
      activeCafeId:
        get().activeCafeId ??
        me.defaultCafeId ??
        me.memberships[0]?.cafeId ??
        null,
    });
  },

  setActiveCafe(cafeId) {
    set({ activeCafeId: cafeId });
  },
}));
