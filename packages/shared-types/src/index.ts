// === Auth ===

export interface SignupRequest {
  name: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  defaultCupsPerDay: number | null;
  defaultGramsPerCup: number | null;
  createdAt: string;
}

// === Onboarding ===

export interface OnboardingRequest {
  defaultCupsPerDay: number;
  defaultGramsPerCup: number;
}

// === Bean ===

export interface BeanCreateRequest {
  name: string;
  totalAmount: number;
  roastDate: string;
  perCup: number;
  deliveryDays: number;
  degassingDays: number;
}

export interface BeanUpdateRequest {
  name?: string;
  totalAmount?: number;
  roastDate?: string;
  perCup?: number;
  deliveryDays?: number;
  degassingDays?: number;
}

export type BeanStatus = 'safe' | 'order';

export interface BeanWithStats {
  id: number;
  cafeId: number;
  name: string;
  totalAmount: number;
  remainAmount: number;
  roastDate: string;
  perCup: number;
  deliveryDays: number;
  degassingDays: number;
  createdBy: number;
  createdAt: string;
  remainCups: number;
  remainDays: number;
  progress: number;
  rop: number;
  status: BeanStatus;
  dailyConsumption: number;
}

// === Consumption ===

export interface ConsumptionCreateRequest {
  amount: number;
  water?: number;
  grindSize?: string;
  method?: string;
  note?: string;
}

// === Cafe ===

export interface CafeInfo {
  id: number;
  name: string;
  memberCount: number;
}

export type CafeMemberRole = 'admin' | 'member';

export interface CafeMember {
  id: number;
  userId: number;
  userName: string;
  role: CafeMemberRole;
  joinedAt: string;
}

// === Invite ===

export interface InviteCreateRequest {
  expiresInHours?: number;
}

export interface InviteInfo {
  cafeName: string;
  invitedByName: string;
  expiresAt: string;
}

// === Push ===

export interface PushSubscribeRequest {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

// === API Response ===

export interface ApiResponse<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}
