import { request, ACCESS_TOKEN_KEY } from "./client";

const token = () => localStorage.getItem(ACCESS_TOKEN_KEY);

export const listRooms = () => request("/forum/rooms", { token: token() });

export const createRoom = (name, description) =>
  request("/forum/rooms", { method: "POST", body: { name, description }, token: token() });

export const listMessages = (roomId, page = 0, size = 30) =>
  request(`/forum/rooms/${roomId}/messages?page=${page}&size=${size}`, { token: token() });

export const searchMessages = (roomId, query, page = 0, size = 20) =>
  request(`/forum/rooms/${roomId}/messages/search?q=${encodeURIComponent(query)}&page=${page}&size=${size}`, {
    token: token(),
  });

export const locateMessagePage = (roomId, messageId, size = 30) =>
  request(`/forum/rooms/${roomId}/messages/${messageId}/locate?size=${size}`, { token: token() });

export const sendMessage = (roomId, text, imageUrl, file) =>
  request(`/forum/rooms/${roomId}/messages`, {
    method: "POST",
    body: {
      text,
      imageUrl,
      fileUrl: file?.url,
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
    },
    token: token(),
  });

export const reportMessage = (messageId, reason) =>
  request(`/forum/messages/${messageId}/report`, { method: "POST", body: { reason }, token: token() });

export const unreportMessage = (messageId) =>
  request(`/forum/messages/${messageId}/report`, { method: "DELETE", token: token() });

export const toggleLikeMessage = (messageId) =>
  request(`/forum/messages/${messageId}/like`, { method: "POST", token: token() });

export const recallMessage = (messageId) =>
  request(`/forum/messages/${messageId}`, { method: "DELETE", token: token() });

export function toFrontendRoom(r) {
  return {
    id: r.id,
    name: r.name,
    description: r.description || "",
    createdBy: { id: r.createdBy.id, name: r.createdBy.name, avatar: r.createdBy.avatar },
    createdAt: r.createdAt,
  };
}

export function toFrontendMessage(m) {
  return {
    id: m.id,
    author: { id: m.sender.id, name: m.sender.name, avatar: m.sender.avatar },
    content: m.text || "",
    image: m.imageUrl || undefined,
    file: m.fileUrl
      ? { url: m.fileUrl, name: m.fileName, size: m.fileSize, type: m.fileType }
      : undefined,
    likedBy: m.likedBy || [],
    reportedByMe: !!m.reportedByMe,
    recalled: !!m.recalled,
    time: new Date(m.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
    createdAt: m.createdAt,
  };
}
