import * as SecureStore from "expo-secure-store";

const KEYS = {
  accessToken: "hc.accessToken",
  refreshToken: "hc.refreshToken",
} as const;

export async function saveTokens(tokens: {
  accessToken: string;
  refreshToken?: string;
}): Promise<void> {
  await SecureStore.setItemAsync(KEYS.accessToken, tokens.accessToken);
  if (tokens.refreshToken) {
    await SecureStore.setItemAsync(KEYS.refreshToken, tokens.refreshToken);
  }
}

export async function getTokens(): Promise<{
  accessToken: string | null;
  refreshToken: string | null;
}> {
  const [accessToken, refreshToken] = await Promise.all([
    SecureStore.getItemAsync(KEYS.accessToken),
    SecureStore.getItemAsync(KEYS.refreshToken),
  ]);
  return { accessToken, refreshToken };
}

export async function clearTokens(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(KEYS.accessToken),
    SecureStore.deleteItemAsync(KEYS.refreshToken),
  ]);
}
