const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";

export const ACCESS_TOKEN_KEY = "mingo-access-token";
export const REFRESH_TOKEN_KEY = "mingo-refresh-token";

export const SESSION_EXPIRED_EVENT = "mingo:session-expired";

// Paths that must never trigger a refresh-and-retry (avoids infinite loops).
const AUTH_PATHS = new Set(["/auth/login", "/auth/register", "/auth/refresh"]);

export class ApiError extends Error {
  constructor(message, status, fieldErrors) {
    super(message);
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

async function rawFetch(path, { method, body, token }) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json() : null;
  return { res, data };
}

let refreshPromise = null;

// Exchanges the stored refresh token for a new access/refresh token pair.
// Concurrent callers share the same in-flight request instead of each firing their own.
export function refreshAccessToken() {
  if (refreshPromise) return refreshPromise;

  const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (!storedRefreshToken) return Promise.resolve(null);

  refreshPromise = rawFetch("/auth/refresh", { method: "POST", body: { refreshToken: storedRefreshToken } })
    .then(({ res, data }) => {
      if (!res.ok) throw new Error("refresh failed");
      localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
      return data.accessToken;
    })
    .catch(() => {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
      return null;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

// The backend has no custom AuthenticationEntryPoint, so Spring Security's
// default falls back to 403 (not 401) for both missing and expired/invalid tokens.
export function isAuthFailure(status) {
  return status === 401 || status === 403;
}

export async function request(path, { method = "GET", body, token } = {}) {
  let { res, data } = await rawFetch(path, { method, body, token });

  if (isAuthFailure(res.status) && token && !AUTH_PATHS.has(path)) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      ({ res, data } = await rawFetch(path, { method, body, token: newToken }));
    }
  }

  if (!res.ok) {
    throw new ApiError(data?.message || "Đã có lỗi xảy ra, vui lòng thử lại sau", res.status, data?.fieldErrors);
  }
  return data;
}
