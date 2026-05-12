// Recipe / Equipment / Bean — shared-types에서 단일 진실. 클라이언트는 그대로 re-export.
export type {
  RecipeResponse,
  RecipeMethod,
  RecipeCreateRequest,
  RecipeUpdateRequest,
  RecipeEquipmentInfo,
  BrewingParams,
  PourOverParams,
  EspressoParams,
  FrenchPressParams,
  AeropressParams,
  PourStage,
  PourStyle,
  EquipmentResponse,
  EquipmentType,
  EquipmentCreateRequest,
  BeanType,
  BeanProcess,
  BeanCatalogItem,
  BeanFinishedReason,
  RopStatus,
  RopInfo,
  CafeBeanResponse,
  CafeBeanCreateRequest,
  CafeBeanUpdateRequest,
} from "@home-coffing/shared-types";

import type {
  CafeBeanResponse,
  RecipeResponse,
} from "@home-coffing/shared-types";

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

// T005 — Bean = CafeBeanResponse (한 봉지). bean catalog 정보는 bean.bean.{name,type,process,...}.
// shared-types와 정합: Bean alias 유지로 호출처 변경 최소화. 새 코드는 CafeBeanResponse 직접 사용 권장.
export type Bean = CafeBeanResponse;

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
  memo: string | null;
  recipe: RecipeResponse | null;
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
