export type CafeRole = "admin" | "member";

export interface UserMe {
  id: number;
  email: string;
  displayName: string | null;
  defaultCafeId: number | null;
  memberships: Array<{
    cafeId: number;
    cafeName: string;
    role: CafeRole;
    joinedAt: string;
  }>;
}

export interface AuthTokensResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: number;
    email: string;
    displayName: string | null;
    defaultCafeId: number | null;
  };
}

export type RopStatus = "fresh" | "soon" | "urgent" | "paused";

export interface RopInfo {
  status: RopStatus;
  cupsRemaining: number;
  daysRemaining: number | null;
  dailyGrams: number;
  source: "measured" | "fallback";
}

export type BeanFinishedReason = "consumed" | "discarded";

export interface Bean {
  id: number;
  cafeId: number;
  name: string;
  origin: string | null;
  roaster: { id: number; name: string } | null;
  totalGrams: number;
  remainGrams: number;
  orderedAt: string;
  roastedOn: string;
  arrivedAt: string | null;
  degassingDays: number;
  cupsPerDay: number;
  gramsPerCup: number;
  autoRopEnabled: boolean;
  finishedAt: string | null;
  finishedReason: BeanFinishedReason | null;
  archivedAt: string | null;
  createdAt: string;
  rop: RopInfo;
}

export interface TasteNoteResponse {
  id: number;
  recordId: number;
  author: {
    id: number;
    email: string;
    displayName: string | null;
  };
  rating: number | null;
  memo: string | null;
  createdAt: string;
}

export interface Record {
  id: number;
  cafeId: number;
  user: {
    id: number;
    email: string;
    displayName: string | null;
  };
  totalGrams: number;
  cups: number | null;
  brewedAt: string;
  loggedAt: string;
  tasteNotes: TasteNoteResponse[];
  beans: Array<{
    beanId: number;
    beanName: string;
    grams: number;
  }>;
  createdAt: string;
}

export interface Cafe {
  id: number;
  name: string;
  createdAt: string;
  members: Array<{
    userId: number;
    email: string;
    displayName: string | null;
    role: CafeRole;
    joinedAt: string;
  }>;
}

export interface Invitation {
  id: number;
  code: string;
  expiresAt: string;
  invitedBy: number;
}
