import { request, ACCESS_TOKEN_KEY } from "./client";

const token = () => localStorage.getItem(ACCESS_TOKEN_KEY);

export const getMe = (accessToken) => request("/users/me", { token: accessToken });

export const updateMe = (accessToken, patch) =>
  request("/users/me", { method: "PATCH", body: patch, token: accessToken });

export const getById = (userId) => request(`/users/${userId}`, { token: token() });

export const searchUsers = (query, page = 0, size = 5) =>
  request(`/users/search?q=${encodeURIComponent(query)}&page=${page}&size=${size}`, { token: token() });

export const changePassword = (currentPassword, newPassword) =>
  request("/users/me/password", { method: "PATCH", body: { currentPassword, newPassword }, token: token() });

export const changeEmail = (newEmail, currentPassword) =>
  request("/users/me/email", { method: "PATCH", body: { newEmail, currentPassword }, token: token() });

export const deleteAccount = (currentPassword) =>
  request("/users/me", { method: "DELETE", body: { currentPassword }, token: token() });
