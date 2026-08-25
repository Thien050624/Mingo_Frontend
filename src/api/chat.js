import { request, ACCESS_TOKEN_KEY } from "./client";
import { formatRelativeTime } from "../utils/time";

const token = () => localStorage.getItem(ACCESS_TOKEN_KEY);

export const listConversations = () => request("/chat/conversations", { token: token() });

export const unreadCount = () => request("/chat/conversations/unread-count", { token: token() });

export const createDirectConversation = (otherUserId) =>
  request("/chat/conversations/direct", { method: "POST", body: { otherUserId }, token: token() });

export const createGroupConversation = (name, memberIds) =>
  request("/chat/conversations/group", { method: "POST", body: { name, memberIds }, token: token() });

export const listMessages = (conversationId, page = 0, size = 30) =>
  request(`/chat/conversations/${conversationId}/messages?page=${page}&size=${size}`, { token: token() });

export const searchMessages = (conversationId, query, page = 0, size = 20) =>
  request(
    `/chat/conversations/${conversationId}/messages/search?q=${encodeURIComponent(query)}&page=${page}&size=${size}`,
    { token: token() }
  );

export const locateMessagePage = (conversationId, messageId, size = 30) =>
  request(`/chat/conversations/${conversationId}/messages/${messageId}/locate?size=${size}`, { token: token() });

export const sendMessage = (conversationId, text, imageUrl, file, replyToMessageId) =>
  request(`/chat/conversations/${conversationId}/messages`, {
    method: "POST",
    body: {
      text,
      imageUrl,
      fileUrl: file?.url,
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      replyToMessageId,
    },
    token: token(),
  });

export const forwardMessage = (targetConversationId, sourceMessageId) =>
  request(`/chat/conversations/${targetConversationId}/messages/forward`, {
    method: "POST",
    body: { sourceMessageId },
    token: token(),
  });

export const markRead = (conversationId) =>
  request(`/chat/conversations/${conversationId}/read`, { method: "PUT", token: token() });

export const clearConversation = (conversationId) =>
  request(`/chat/conversations/${conversationId}/participants/me`, { method: "DELETE", token: token() });

export const leaveGroup = (conversationId) =>
  request(`/chat/conversations/${conversationId}/leave`, { method: "POST", token: token() });

export const disbandGroup = (conversationId) =>
  request(`/chat/conversations/${conversationId}`, { method: "DELETE", token: token() });

export const addMembers = (conversationId, memberIds) =>
  request(`/chat/conversations/${conversationId}/members`, {
    method: "POST",
    body: { memberIds },
    token: token(),
  });

export const removeMember = (conversationId, memberId) =>
  request(`/chat/conversations/${conversationId}/members/${memberId}`, { method: "DELETE", token: token() });

export const recallMessage = (conversationId, messageId) =>
  request(`/chat/conversations/${conversationId}/messages/${messageId}`, { method: "DELETE", token: token() });

export const editMessage = (conversationId, messageId, text) =>
  request(`/chat/conversations/${conversationId}/messages/${messageId}`, {
    method: "PUT",
    body: { text },
    token: token(),
  });

export const toggleLikeMessage = (conversationId, messageId) =>
  request(`/chat/conversations/${conversationId}/messages/${messageId}/like`, { method: "POST", token: token() });

export const togglePin = (conversationId, messageId) =>
  request(`/chat/conversations/${conversationId}/messages/${messageId}/pin`, { method: "POST", token: token() });

export const listPinnedMessages = (conversationId) =>
  request(`/chat/conversations/${conversationId}/messages/pinned`, { token: token() });

export const reportMessage = (conversationId, messageId, reason) =>
  request(`/chat/conversations/${conversationId}/messages/${messageId}/report`, {
    method: "POST",
    body: { reason },
    token: token(),
  });

export const unreportMessage = (conversationId, messageId) =>
  request(`/chat/conversations/${conversationId}/messages/${messageId}/report`, {
    method: "DELETE",
    token: token(),
  });

export const setMuted = (conversationId, muted) =>
  request(`/chat/conversations/${conversationId}/mute`, {
    method: "PUT",
    body: { muted },
    token: token(),
  });

function systemMessageText(m) {
  if (m.type === "SYSTEM_LEFT") return `${m.sender.name} đã rời khỏi nhóm`;
  if (m.type === "SYSTEM_DISBANDED") return `${m.sender.name} đã giải tán nhóm`;
  if (m.type === "SYSTEM_ADDED") return `${m.sender.name} đã thêm ${m.text} vào nhóm`;
  if (m.type === "SYSTEM_REMOVED") return `${m.sender.name} đã xoá ${m.text} khỏi nhóm`;
  return "";
}

export function toFrontendMessage(m, currentUserId) {
  const isSystem = m.type && m.type !== "TEXT";
  const likedBy = m.likedBy || [];
  return {
    id: m.id,
    from: m.sender.id === currentUserId ? "me" : "them",
    senderId: m.sender.id,
    senderName: m.sender.name,
    senderAvatar: m.sender.avatar,
    text: m.text || "",
    image: m.imageUrl || undefined,
    file: m.fileUrl
      ? { url: m.fileUrl, name: m.fileName, size: m.fileSize, type: m.fileType }
      : undefined,
    replyTo: m.replyTo
      ? {
          id: m.replyTo.id,
          senderName: m.replyTo.senderName,
          text: m.replyTo.text,
          hasImage: m.replyTo.hasImage,
          hasFile: m.replyTo.hasFile,
          recalled: m.replyTo.recalled,
        }
      : undefined,
    forwarded: !!m.forwarded,
    pinned: !!m.pinned,
    edited: !!m.edited,
    time: new Date(m.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
    createdAt: m.createdAt,
    likedBy,
    liked: likedBy.some((p) => p.id === currentUserId),
    reportedByMe: !!m.reportedByMe,
    system: isSystem,
    systemText: isSystem ? systemMessageText(m) : undefined,
    recalled: !!m.recalled,
  };
}

export function replyPreviewText(replyTo) {
  if (!replyTo) return "";
  if (replyTo.recalled) return "Tin nhắn đã được thu hồi";
  if (replyTo.text) return replyTo.text;
  if (replyTo.hasImage) return "Đã gửi một ảnh";
  if (replyTo.hasFile) return "Đã gửi một tệp đính kèm";
  return "";
}

function lastMessagePreview(lastMessage) {
  if (!lastMessage) return "";
  if (lastMessage.recalled) return "Tin nhắn đã được thu hồi";
  if (lastMessage.type && lastMessage.type !== "TEXT") return systemMessageText(lastMessage);
  if (lastMessage.text) return lastMessage.text;
  if (lastMessage.imageUrl) return "Đã gửi một ảnh";
  if (lastMessage.fileType?.startsWith("video/")) return "Đã gửi một video";
  if (lastMessage.fileUrl) return "Đã gửi một tệp";
  return "";
}

export function toFrontendConversation(c, currentUserId) {
  const others = c.participants.filter((p) => p.id !== currentUserId);
  const displayUser = c.group
    ? { id: null, name: c.name || "Nhóm chat", avatar: c.avatarUrl || "" }
    : others[0] || { id: null, name: "Người dùng", avatar: "" };

  return {
    id: c.id,
    group: c.group,
    user: displayUser,
    participants: c.participants,
    createdBy: c.createdBy,
    isLeader: c.group && c.createdBy === currentUserId,
    readReceipts: c.readReceipts || [],
    online: false,
    lastMessage: lastMessagePreview(c.lastMessage),
    time: c.lastMessage ? formatRelativeTime(c.lastMessage.createdAt) : formatRelativeTime(c.createdAt),
    unread: c.unreadCount,
    muted: !!c.muted,
    messages: [],
    messagesLoaded: false,
    messagesPage: 0,
    hasMoreMessages: false,
    loadingOlderMessages: false,
  };
}
