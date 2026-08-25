import { request, ACCESS_TOKEN_KEY } from "./client";

const token = () => localStorage.getItem(ACCESS_TOKEN_KEY);

export const listMessages = (page = 0, size = 30) =>
  request(`/forum/messages?page=${page}&size=${size}`, { token: token() });

export const searchMessages = (query, page = 0, size = 20) =>
  request(`/forum/messages/search?q=${encodeURIComponent(query)}&page=${page}&size=${size}`, { token: token() });

export const locateMessagePage = (messageId, size = 30) =>
  request(`/forum/messages/${messageId}/locate?size=${size}`, { token: token() });

export const sendMessage = (text, imageUrl, file) =>
  request("/forum/messages", {
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
