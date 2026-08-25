const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";

export const ACCESS_TOKEN_KEY = "mingo-access-token";
export const REFRESH_TOKEN_KEY = "mingo-refresh-token";

export const SESSION_EXPIRED_EVENT = "mingo:session-expired";

// Paths that must never trigger a refresh-and-retry (avoids infinite loops).
const AUTH_PATHS = new Set(["/auth/login", "/auth/register", "/auth/refresh"]);

// Render's free tier spins the backend down after 15 min idle; the first request after
// a sleep can fail outright (not just be slow) while the container boots back up.
const REQUEST_TIMEOUT_MS = 20000;
const COLD_START_RETRY_DELAY_MS = 5000;

export class ApiError extends Error {
  constructor(message, status, fieldErrors) {
    super(message);
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function rawFetch(path, { method, body, token }) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (err) {
    const message =
      err.name === "AbortError"
        ? "Máy chủ phản hồi quá lâu, vui lòng thử lại sau ít giây"
        : "Máy chủ đang khởi động lại, vui lòng thử lại sau ít giây";
    throw new ApiError(message, 0, null);
  } finally {
    clearTimeout(timer);
  }

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
  let result;
  try {
    result = await rawFetch(path, { method, body, token });
  } catch (err) {
    if (err instanceof ApiError && err.status === 0) {
      await sleep(COLD_START_RETRY_DELAY_MS);
      result = await rawFetch(path, { method, body, token });
    } else {
      throw err;
    }
  }

  let { res, data } = result;

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
