import { createContext, useContext, useEffect, useState } from "react";
import * as authApi from "../api/auth";
import * as usersApi from "../api/users";
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, SESSION_EXPIRED_EVENT } from "../api/client";

const UserContext = createContext(null);

export function toFrontendUser(profile) {
  return {
    id: profile.id,
    name: profile.displayName || "",
    email: profile.email,
    avatar: profile.avatarUrl || "",
    bio: profile.bio || "",
    work: profile.work || "",
    location: profile.location || "",
    gender: profile.gender || "",
    role: profile.role,
    onboarded: profile.onboarded,
    friendsCount: 0,
    followersCount: 0,
  };
}

export function UserProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!token) {
      setLoading(false);
      return;
    }
    usersApi
      .getMe(token)
      .then((profile) => setCurrentUser(toFrontendUser(profile)))
      .catch(() => {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const onSessionExpired = () => setCurrentUser(null);
    window.addEventListener(SESSION_EXPIRED_EVENT, onSessionExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onSessionExpired);
  }, []);

  const login = async (email, password) => {
    const res = await authApi.login(email, password);
    localStorage.setItem(ACCESS_TOKEN_KEY, res.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, res.refreshToken);
    const profile = await usersApi.getMe(res.accessToken);
    const mapped = toFrontendUser(profile);
    setCurrentUser(mapped);
    return mapped;
  };

  const register = async (email, password) => {
    const res = await authApi.register(email, password);
    localStorage.setItem(ACCESS_TOKEN_KEY, res.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, res.refreshToken);
    const profile = await usersApi.getMe(res.accessToken);
    const mapped = toFrontendUser(profile);
    setCurrentUser(mapped);
    return mapped;
  };

  const logout = () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    setCurrentUser(null);
  };

  const updateProfile = async (updates) => {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    const payload = {
      displayName: updates.name,
      gender: updates.gender,
      avatarUrl: updates.avatar,
      bio: updates.bio,
      work: updates.work,
      location: updates.location,
    };
    const profile = await usersApi.updateMe(token, payload);
    const mapped = toFrontendUser(profile);
    setCurrentUser(mapped);
    return mapped;
  };

  const changePassword = (currentPassword, newPassword) =>
    usersApi.changePassword(currentPassword, newPassword);

  const changeEmail = async (newEmail, currentPassword) => {
    const res = await usersApi.changeEmail(newEmail, currentPassword);
    localStorage.setItem(ACCESS_TOKEN_KEY, res.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, res.refreshToken);
    setCurrentUser((prev) => (prev ? { ...prev, email: res.email } : prev));
  };

  const deleteAccount = async (currentPassword) => {
    await usersApi.deleteAccount(currentPassword);
    logout();
  };

  return (
    <UserContext.Provider
      value={{
        currentUser,
        loading,
        login,
        register,
        logout,
        updateProfile,
        changePassword,
        changeEmail,
        deleteAccount,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useCurrentUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useCurrentUser must be used within a UserProvider");
  return ctx;
}
