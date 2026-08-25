import { request } from "./client";

export const register = (email, password) =>
  request("/auth/register", { method: "POST", body: { email, password } });

export const login = (email, password) =>
  request("/auth/login", { method: "POST", body: { email, password } });

export const loginWithGoogle = (idToken) =>
  request("/auth/google", { method: "POST", body: { idToken } });
