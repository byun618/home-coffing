import { Pressable, Text, View } from "react-native";

import type { RecipeJson } from "../../lib/types";
import { NumberField } from "./NumberField";
import { TextField } from "./TextField";

type BrewingMethod = NonNullable<RecipeJson["brewingMethod"]>;

const BREW_OPTIONS: Array<{ value: BrewingMethod; label: string }> = [
  { value: "v60", label: "V60" },
  { value: "switch", label: "스위치" },
  { value: "espresso", label: "에스프레소" },
  { value: "moka", label: "모카포트" },
  { value: "aeropress", label: "에어로프레스" },
  { value: "french_press", label: "프렌치프레스" },
  { value: "other", label: "기타" },
];

export interface RecipeFormState {
  brewingMethod: BrewingMethod | "";
  waterTempCelsius: string;
  iceGrams: string;
  totalYieldGrams: string;
  totalTimeSeconds: string;
  extraNote: string;
}

export function emptyRecipeForm(): RecipeFormState {
  return {
    brewingMethod: "",
    waterTempCelsius: "",
    iceGrams: "",
    totalYieldGrams: "",
    totalTimeSeconds: "",
    extraNote: "",
  };
}

export function recipeFormFromJson(recipe: RecipeJson | null): RecipeFormState {
  if (!recipe) return emptyRecipeForm();
  return {
    brewingMethod: recipe.brewingMethod ?? "",
    waterTempCelsius:
      recipe.waterTempCelsius !== undefined
        ? String(recipe.waterTempCelsius)
        : "",
    iceGrams: recipe.iceGrams !== undefined ? String(recipe.iceGrams) : "",
    totalYieldGrams:
      recipe.totalYieldGrams !== undefined
        ? String(recipe.totalYieldGrams)
        : "",
    totalTimeSeconds:
      recipe.totalTimeSeconds !== undefined
        ? String(recipe.totalTimeSeconds)
        : "",
    extraNote: recipe.extraNote ?? "",
  };
}

export function recipeFormToJson(form: RecipeFormState): RecipeJson | undefined {
  const result: RecipeJson = {};
  if (form.brewingMethod) result.brewingMethod = form.brewingMethod;
  if (form.waterTempCelsius)
    result.waterTempCelsius = Number(form.waterTempCelsius);
  if (form.iceGrams) result.iceGrams = Number(form.iceGrams);
  if (form.totalYieldGrams)
    result.totalYieldGrams = Number(form.totalYieldGrams);
  if (form.totalTimeSeconds)
    result.totalTimeSeconds = Number(form.totalTimeSeconds);
  if (form.extraNote.trim()) result.extraNote = form.extraNote.trim();
  return Object.keys(result).length === 0 ? undefined : result;
}

export function recipeFormDirty(
  current: RecipeFormState,
  baseline: RecipeFormState,
): boolean {
  return (Object.keys(baseline) as Array<keyof RecipeFormState>).some(
    (key) => current[key] !== baseline[key],
  );
}

interface Props {
  value: RecipeFormState;
  onChange: (next: RecipeFormState) => void;
}

export function RecipeFields({ value, onChange }: Props) {
  function set<K extends keyof RecipeFormState>(
    key: K,
    next: RecipeFormState[K],
  ) {
    onChange({ ...value, [key]: next });
  }

  return (
    <View className="gap-3">
      <View className="gap-1.5">
        <Text className="text-[13px] font-pretendard-medium text-text-secondary">
          추출 방식
          <Text className="text-text-tertiary"> · 선택</Text>
        </Text>
        <View className="flex-row flex-wrap gap-1.5">
          {BREW_OPTIONS.map((option) => {
            const active = value.brewingMethod === option.value;
            return (
              <Pressable
                key={option.value}
                onPress={() =>
                  set("brewingMethod", active ? "" : option.value)
                }
                className={`px-3 py-2 rounded-pill border ${
                  active
                    ? "bg-accent border-accent"
                    : "bg-bg-secondary border-divider"
                }`}
              >
                <Text
                  className={`text-[12px] font-pretendard-medium ${
                    active ? "text-text-on-dark" : "text-text-secondary"
                  }`}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View className="flex-row gap-3">
        <View className="flex-1">
          <NumberField
            label="물 온도"
            value={value.waterTempCelsius}
            onChangeText={(v) => set("waterTempCelsius", v)}
            placeholder="92"
            unit="°C"
            decimals
          />
        </View>
        <View className="flex-1">
          <NumberField
            label="얼음"
            value={value.iceGrams}
            onChangeText={(v) => set("iceGrams", v)}
            placeholder="0"
            unit="g"
            decimals
          />
        </View>
      </View>

      <View className="flex-row gap-3">
        <View className="flex-1">
          <NumberField
            label="추출량"
            value={value.totalYieldGrams}
            onChangeText={(v) => set("totalYieldGrams", v)}
            placeholder="240"
            unit="g"
            decimals
          />
        </View>
        <View className="flex-1">
          <NumberField
            label="추출 시간"
            value={value.totalTimeSeconds}
            onChangeText={(v) => set("totalTimeSeconds", v)}
            placeholder="180"
            unit="초"
          />
        </View>
      </View>

      <TextField
        label="레시피 메모 (선택)"
        value={value.extraNote}
        onChangeText={(v) => set("extraNote", v)}
        placeholder="블루밍 30g/30s, 1차 60g/45s..."
        multiline
      />
    </View>
  );
}
