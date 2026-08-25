import { ApiError, ACCESS_TOKEN_KEY, refreshAccessToken, isAuthFailure } from "./client";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";

async function postFile(file, token) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE}/uploads`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json() : null;
  return { res, data };
}

async function performUpload(file) {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  let { res, data } = await postFile(file, token);

  if (isAuthFailure(res.status) && token) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      ({ res, data } = await postFile(file, newToken));
    }
  }

  if (!res.ok) {
    throw new ApiError(data?.message || "Không thể tải tệp lên", res.status, data?.fieldErrors);
  }
  return data;
}

export async function uploadImage(file) {
  const data = await performUpload(file);
  return data.url;
}

export async function uploadFile(file) {
  return performUpload(file);
}
