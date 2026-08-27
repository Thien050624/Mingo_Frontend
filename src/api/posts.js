import { request, ACCESS_TOKEN_KEY } from "./client";
import { formatRelativeTime } from "../utils/time";

const token = () => localStorage.getItem(ACCESS_TOKEN_KEY);

export const getFeed = (page = 0, size = 20) =>
  request(`/posts?page=${page}&size=${size}`, { token: token() });

export const getPostsByUser = (userId, page = 0, size = 20) =>
  request(`/posts/user/${userId}?page=${page}&size=${size}`, { token: token() });

export const getPost = (postId) => request(`/posts/${postId}`, { token: token() });

export const createPost = ({ content, images, visibility }) =>
  request("/posts", { method: "POST", body: { content, images, visibility }, token: token() });

export const updatePost = (postId, { content, images, visibility }) =>
  request(`/posts/${postId}`, { method: "PATCH", body: { content, images, visibility }, token: token() });

export const deletePost = (postId) =>
  request(`/posts/${postId}`, { method: "DELETE", token: token() });

export const addComment = (postId, content, parentCommentId, imageUrl) =>
  request(`/posts/${postId}/comments`, {
    method: "POST",
    body: { content, parentCommentId, imageUrl },
    token: token(),
  });

export const likeComment = (postId, commentId) =>
  request(`/posts/${postId}/comments/${commentId}/like`, { method: "PUT", token: token() });

export const unlikeComment = (postId, commentId) =>
  request(`/posts/${postId}/comments/${commentId}/like`, { method: "DELETE", token: token() });

export const reportComment = (postId, commentId, reason) =>
  request(`/posts/${postId}/comments/${commentId}/report`, { method: "POST", body: { reason }, token: token() });

export const unreportComment = (postId, commentId) =>
  request(`/posts/${postId}/comments/${commentId}/report`, { method: "DELETE", token: token() });

export const setReaction = (postId, type) =>
  request(`/posts/${postId}/reaction`, { method: "PUT", body: { type }, token: token() });

export const removeReaction = (postId) =>
  request(`/posts/${postId}/reaction`, { method: "DELETE", token: token() });

export const reportPost = (postId, reason) =>
  request(`/posts/${postId}/report`, { method: "POST", body: { reason }, token: token() });

export const unreportPost = (postId) =>
  request(`/posts/${postId}/report`, { method: "DELETE", token: token() });

export const getSavedPosts = (page = 0, size = 20) =>
  request(`/posts/saved?page=${page}&size=${size}`, { token: token() });

export const searchPosts = (query, page = 0, size = 5) =>
  request(`/posts/search?q=${encodeURIComponent(query)}&page=${page}&size=${size}`, { token: token() });

export const savePost = (postId) =>
  request(`/posts/${postId}/save`, { method: "PUT", token: token() });

export const unsavePost = (postId) =>
  request(`/posts/${postId}/save`, { method: "DELETE", token: token() });

export function toFrontendPost(p) {
  return {
    id: p.id,
    author: { id: p.author.id, name: p.author.name, avatar: p.author.avatar },
    time: formatRelativeTime(p.createdAt),
    content: p.content,
    images: p.images || [],
    visibility: p.visibility,
    reactions: p.reactions,
    myReaction: p.myReaction,
    comments: (p.comments || []).map(toFrontendComment),
    reportedByMe: !!p.reportedByMe,
    savedByMe: !!p.savedByMe,
  };
}

function toFrontendComment(c) {
  return {
    id: c.id,
    author: { id: c.author.id, name: c.author.name, avatar: c.author.avatar },
    content: c.content,
    imageUrl: c.imageUrl,
    time: formatRelativeTime(c.createdAt),
    likeCount: c.likeCount,
    likedByMe: c.likedByMe,
    reportedByMe: !!c.reportedByMe,
    replies: (c.replies || []).map(toFrontendComment),
  };
}
