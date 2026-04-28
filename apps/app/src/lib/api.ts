import { clearTokens, getTokens, saveTokens } from "./secure-storage";

const BASE = process.env.EXPO_PUBLIC_API_URL;

if (!BASE) {
  // eslint-disable-next-line no-console
  console.warn("EXPO_PUBLIC_API_URL is not set. Check apps/app/.env");
}

export interface ApiErrorBody {
  code: string;
  message: string;
  field?: string;
  meta?: Record<string, unknown>;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: ApiErrorBody,
  ) {
    super(body.message);
  }
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  auth?: boolean;
}

let onUnauthorized: (() => void) | null = null;

export function setOnUnauthorized(fn: () => void): void {
  onUnauthorized = fn;
}

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    const { refreshToken } = await getTokens();
    if (!refreshToken) return null;

    const res = await fetch(`${BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return null;
    const data: { accessToken: string } = await res.json();
    await saveTokens({ accessToken: data.accessToken });
    return data.accessToken;
  })().finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
}

async function request<T>(
  path: string,
  options: RequestOptions = {},
  retryOnAuth = true,
): Promise<T> {
  const { auth = true, body, headers, ...rest } = options;
  const finalHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...(headers as Record<string, string> | undefined),
  };

  if (auth) {
    const { accessToken } = await getTokens();
    if (accessToken) {
      finalHeaders.Authorization = `Bearer ${accessToken}`;
    }
  }

  const res = await fetch(`${BASE}${path}`, {
    ...rest,
    headers: finalHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && auth && retryOnAuth) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return request<T>(path, options, false);
    }
    await clearTokens();
    onUnauthorized?.();
  }

  if (res.status === 204) {
    return undefined as T;
  }

  let payload: unknown = null;
  const text = await res.text();
  if (text.length > 0) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (!res.ok) {
    const errBody: ApiErrorBody =
      payload && typeof payload === "object" && "code" in (payload as object)
        ? (payload as ApiErrorBody)
        : {
            code: "HTTP_ERROR",
            message:
              typeof payload === "string"
                ? payload
                : `Request failed: ${res.status}`,
          };
    throw new ApiError(res.status, errBody);
  }

  return payload as T;
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "POST", body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "PATCH", body }),
  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "DELETE" }),
};
