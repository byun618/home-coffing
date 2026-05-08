/**
 * BrewingParams — Recipe.params JSON 컬럼 타입.
 * Discriminated union by `method`. Service에서 switch narrowing 사용 (`as` 금지).
 *
 * shared-types(@home-coffing/shared-types) BrewingParams와 shape 100% 동일.
 * MikroORM JSON 컬럼 호환을 위해 별도 선언 (re-export 시 데코레이터 메타 처리 이슈 회피).
 */

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
