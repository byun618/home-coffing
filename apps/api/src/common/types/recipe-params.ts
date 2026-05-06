export interface RecipeStep {
  label: string;
  atMark?: string;
  yieldGrams?: number;
  note?: string;
}

export interface RecipeParamsJson {
  coffeeGrams?: number;
  grindSize?: number;
  grindUnit?: string;
  waterTempCelsius?: number;
  totalYieldGrams?: number;
  totalTimeSeconds?: number;
  iceGrams?: number;
  steps?: RecipeStep[];
  extraNote?: string;
}
