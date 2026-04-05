const BASE = process.env.EXPO_PUBLIC_API_URL;

if (!BASE) {
  console.warn("EXPO_PUBLIC_API_URL is not set. Check apps/app/.env");
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!res.ok) {
    throw new Error(`API ${res.status} ${res.statusText}`);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json();
}
