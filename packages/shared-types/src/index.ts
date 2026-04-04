// === Bean ===

export interface BeanCreateRequest {
  name: string;
  totalAmount: number;
  orderedAt: string;
  roastDate: string;
  arrivedAt?: string;
  degassingDays: number;
  cupsPerDay: number;
  gramsPerCup: number;
}

export interface BeanUpdateRequest {
  name?: string;
  totalAmount?: number;
  orderedAt?: string;
  roastDate?: string;
  arrivedAt?: string | null;
  degassingDays?: number;
  cupsPerDay?: number;
  gramsPerCup?: number;
}

export type BeanStatus = 'degassing' | 'safe' | 'soon' | 'order' | 'empty';

export interface BeanWithStats {
  id: number;
  cafeId: number;
  name: string;
  totalAmount: number;
  remainAmount: number;
  orderedAt: string;
  roastDate: string;
  arrivedAt: string | null;
  degassingDays: number;
  cupsPerDay: number;
  gramsPerCup: number;
  createdAt: string;
  progress: number;
  rop: number;
  status: BeanStatus;
  dailyConsumption: number;
  degassingEndDate: string | null;
}

// === Consumption ===

export interface ConsumptionCreateRequest {
  items: { beanId: number; amount: number }[];
}

export interface ConsumptionResult {
  results: { beanId: number; remainAmount: number }[];
}

export interface ConsumptionItem {
  id: number;
  beanId: number;
  beanName: string;
  amount: number;
  createdAt: string;
}

export interface ConsumptionListResponse {
  items: ConsumptionItem[];
  total: number;
}

// === Cafe ===

export interface CafeInfo {
  id: number;
  name: string;
}

// === Push ===

export interface PushSubscribeRequest {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}
