// === Record ===

export interface RecordResponse {
  id: number;
  cafeId: number;
  user: { id: number; email: string; displayName: string | null };
  totalGrams: number;
  cups: number | null;
  brewedAt: string;
  loggedAt: string;
  memo: string | null;
  recipe: RecipeResponse | null;
  tasteNotes: TasteNoteResponse[];
  beans: Array<{ beanId: number; beanName: string; grams: number }>;
  createdAt: string;
}

export interface RecordBeanInput {
  beanId: number;
  grams: number;
}

export interface RecordCreateRequest {
  brewedAt: string;
  beans: RecordBeanInput[];
  recipeId?: number | null;
  memo?: string | null;
}

export interface RecordUpdateRequest {
  brewedAt?: string;
  beans?: RecordBeanInput[];
  recipeId?: number | null;
  memo?: string | null;
}

// === Recipe ===

export type RecipeMethod =
  | 'pour-over'
  | 'espresso'
  | 'french-press'
  | 'aeropress';

export type PourStyle =
  | 'center'
  | 'circle-out'
  | 'circle-in'
  | 'spiral'
  | 'pulse'
  | 'continuous'
  | 'bloom-only';

export interface PourStage {
  label: string;
  startSec: number;
  pourGrams: number;
  pourStyle?: PourStyle;
  direction?: 'cw' | 'ccw';
  notes?: string;
}

export interface PourOverParams {
  method: 'pour-over';
  doseGrams: number;
  grindSize: number;
  waterTempC: number;
  serveMode: 'hot' | 'iced';
  iceGrams?: number;
  totalYieldGrams: number;
  totalTimeSec: number;
  stages: PourStage[];
  notes?: string;
}

export interface EspressoParams {
  method: 'espresso';
  doseGrams: number;
  grindSize: number;
  waterTempC: number;
  yieldGrams: number;
  pressureBar: number;
  preinfusionSec?: number;
}

export interface FrenchPressParams {
  method: 'french-press';
  doseGrams: number;
  grindSize: number;
  waterTempC: number;
  totalYieldGrams: number;
  steepTimeSec: number;
}

export interface AeropressParams {
  method: 'aeropress';
  doseGrams: number;
  grindSize: number;
  waterTempC: number;
  yieldGrams: number;
  steepTimeSec: number;
  orientation: 'standard' | 'inverted';
}

export type BrewingParams =
  | PourOverParams
  | EspressoParams
  | FrenchPressParams
  | AeropressParams;

export interface RecipeEquipmentInfo {
  id: number;
  type: EquipmentType;
  name: string;
  brand: string | null;
  model: string | null;
}

export interface RecipeResponse {
  id: number;
  cafeId: number;
  name: string | null;
  method: RecipeMethod;
  params: BrewingParams | null;
  equipments: RecipeEquipmentInfo[];
  createdBy: { id: number; displayName: string | null } | null;
  createdAt: string;
  usageCount: number;
}

export interface RecipeCreateRequest {
  method: RecipeMethod;
  name?: string | null;
  params: BrewingParams;
  equipmentIds?: number[];
}

export interface RecipeUpdateRequest {
  name?: string | null;
  params?: BrewingParams;
  equipmentIds?: number[];
}

// === Equipment ===

export type EquipmentType = 'grinder' | 'brewer' | 'scale' | 'kettle';

export interface EquipmentResponse {
  id: number;
  type: EquipmentType;
  name: string;
  brand: string | null;
  model: string | null;
}

export interface EquipmentCreateRequest {
  type: EquipmentType;
  name: string;
  brand?: string;
  model?: string;
}

// === TasteNote ===

export interface TasteNoteResponse {
  id: number;
  recordId: number;
  author: { id: number; email: string; displayName: string | null };
  rating: number | null;
  memo: string | null;
  createdAt: string;
}

export interface TasteNoteCreateRequest {
  rating?: number;
  memo?: string;
}

export interface TasteNoteUpdateRequest {
  rating?: number | null;
  memo?: string | null;
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

// === Bean Catalog (T005) ===

export type BeanType = 'single' | 'blend' | 'decaf';
export type BeanProcess = 'washed' | 'natural' | 'honey' | 'anaerobic';

export interface BeanCatalogItem {
  id: number;
  name: string;
  type: BeanType;
  process: BeanProcess | null;
  tastingNote: string[] | null;
}

// === CafeBean (T005) ===

export type BeanFinishedReason = 'consumed' | 'discarded';

export type RopStatus = 'fresh' | 'soon' | 'urgent' | 'paused';

export interface RopInfo {
  status: RopStatus;
  cupsRemaining: number;
  daysRemaining: number | null;
  dailyGrams: number;
  source: 'measured' | 'fallback';
}

export interface CafeBeanCreateRequest {
  beanId: number;
  totalGrams: number;
  orderedAt: string;
  roastedOn: string;
  arrivedAt?: string;
  degassingDays?: number;
  cupsPerDay?: number;
  gramsPerCup?: number;
  autoRopEnabled?: boolean;
}

export interface CafeBeanUpdateRequest {
  beanId?: number;
  totalGrams?: number;
  orderedAt?: string;
  roastedOn?: string;
  arrivedAt?: string | null;
  degassingDays?: number;
  cupsPerDay?: number;
  gramsPerCup?: number;
  autoRopEnabled?: boolean;
  finishedAt?: string | null;
  finishedReason?: BeanFinishedReason | null;
  archivedAt?: string | null;
}

export interface CafeBeanResponse {
  id: number;
  cafeId: number;
  bean: BeanCatalogItem;
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
