import { request } from "./client";
import { formatRelativeTime } from "../utils/time";

const ACCESS_TOKEN_KEY = "mingo-access-token";
const token = () => localStorage.getItem(ACCESS_TOKEN_KEY);

export const list = (page = 0, size = 50) =>
  request(`/notifications?page=${page}&size=${size}`, { token: token() });

export const markAsRead = (id) =>
  request(`/notifications/${id}/read`, { method: "PUT", token: token() });

export const markAllAsRead = () =>
  request("/notifications/read-all", { method: "PUT", token: token() });

export const remove = (id) =>
  request(`/notifications/${id}`, { method: "DELETE", token: token() });

export const removeAll = () =>
  request("/notifications", { method: "DELETE", token: token() });

const TYPE_META = {
  FRIEND_REQUEST: { type: "follow", content: "đã gửi cho bạn lời mời kết bạn" },
  FRIEND_ACCEPTED: { type: "friend", content: "đã chấp nhận lời mời kết bạn của bạn" },
  POST_COMMENT: { type: "comment", content: "đã bình luận về bài viết của bạn" },
  COMMENT_REPLY: { type: "comment", content: "đã phản hồi bình luận của bạn" },
  POST_REACTION: { type: "like", content: "đã bày tỏ cảm xúc về bài viết của bạn" },
  COMMENT_LIKE: { type: "like", content: "đã thích bình luận của bạn" },
  POST_HIDDEN_BY_ADMIN: {
    type: "moderation",
    content: "Bài viết của bạn đã bị ẩn do vi phạm",
    raw: true,
  },
  POST_DELETED_BY_ADMIN: {
    type: "moderation",
    content: "Bài viết của bạn đã bị xóa do vi phạm",
    raw: true,
  },
};

export function toFrontendNotification(n) {
  const meta = TYPE_META[n.type] || { type: "friend", content: "đã tương tác với bạn" };
  return {
    id: n.id,
    user: { id: n.actor.id, name: n.actor.name, avatar: n.actor.avatar },
    type: meta.type,
    content: meta.content,
    raw: !!meta.raw,
    time: formatRelativeTime(n.createdAt),
    unread: !n.read,
    postId: n.postId,
    commentId: n.commentId,
  };
}
