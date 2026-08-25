import { request, ACCESS_TOKEN_KEY } from "./client";

const token = () => localStorage.getItem(ACCESS_TOKEN_KEY);

export const sendRequest = (userId) =>
  request(`/friends/${userId}`, { method: "POST", token: token() });

export const acceptRequest = (userId) =>
  request(`/friends/${userId}/accept`, { method: "PUT", token: token() });

export const removeRelationship = (userId) =>
  request(`/friends/${userId}`, { method: "DELETE", token: token() });

export const getStatus = (userId) => request(`/friends/status/${userId}`, { token: token() });

export const listIncomingRequests = () => request("/friends/requests", { token: token() });

export const listFriends = (userId) => request(`/friends/user/${userId}`, { token: token() });

export const listSuggestions = () => request("/friends/suggestions", { token: token() });

export const blockUser = (userId) =>
  request(`/friends/${userId}/block`, { method: "POST", token: token() });

export const unblockUser = (userId) =>
  request(`/friends/${userId}/block`, { method: "DELETE", token: token() });

export const listBlockedUsers = () => request("/friends/blocked", { token: token() });

export const listOnlineFriends = () => request("/friends/online", { token: token() });

export function toFrontendPerson(u) {
  return { id: u.id, name: u.name || "", avatar: u.avatar || "", work: u.work || "", location: u.location || "" };
}
