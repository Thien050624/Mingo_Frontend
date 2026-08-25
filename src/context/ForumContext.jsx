import { createContext, useContext, useEffect, useState } from "react";
import * as forumApi from "../api/forum";
import { useCurrentUser } from "./UserContext";
import { useWebSocket } from "./WebSocketContext";

const ForumContext = createContext(null);

export function ForumProvider({ children }) {
  const { currentUser } = useCurrentUser();
  const { subscribe } = useWebSocket();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      setMessages([]);
      setLoading(false);
      return;
    }
    forumApi
      .listMessages(0, 30)
      .then((res) => {
        setMessages(res.content.map(forumApi.toFrontendMessage).reverse());
        setPage(0);
        setHasMore(!res.last);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [currentUser?.id]);

  useEffect(() => {
    if (!currentUser) return;
    return subscribe("/user/queue/forum-messages", (payload) => {
      const mapped = forumApi.toFrontendMessage(payload);
      setMessages((prev) => (prev.some((m) => m.id === mapped.id) ? prev : [...prev, mapped]));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  useEffect(() => {
    if (!currentUser) return;
    return subscribe("/user/queue/forum-likes", (payload) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === payload.messageId ? { ...m, likedBy: payload.likedBy } : m))
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  useEffect(() => {
    if (!currentUser) return;
    return subscribe("/user/queue/forum-updates", (payload) => {
      if (payload.hidden) {
        setMessages((prev) => prev.filter((m) => m.id !== payload.messageId));
        return;
      }
      if (!payload.recalled) return;
      setMessages((prev) =>
        prev.map((m) => (m.id === payload.messageId ? { ...m, recalled: true, content: "", image: undefined, file: undefined } : m))
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  useEffect(() => {
    if (!currentUser) return;
    return subscribe("/user/queue/forum-cleared", () => {
      setMessages([]);
      setPage(0);
      setHasMore(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  const loadOlderMessages = async () => {
    if (!hasMore || loadingOlder) return;
    setLoadingOlder(true);
    try {
      const nextPage = page + 1;
      const res = await forumApi.listMessages(nextPage, 30);
      const older = res.content.map(forumApi.toFrontendMessage).reverse();
      setMessages((prev) => [...older, ...prev]);
      setPage(nextPage);
      setHasMore(!res.last);
    } catch (err) {
      console.error("Không thể tải tin nhắn cũ hơn:", err);
    } finally {
      setLoadingOlder(false);
    }
  };

  const searchMessages = async (query) => {
    if (!query.trim()) return [];
    const page = await forumApi.searchMessages(query.trim());
    return page.content.map(forumApi.toFrontendMessage);
  };

  const jumpToMessage = async (messageId) => {
    const { page: targetPage } = await forumApi.locateMessagePage(messageId, 30);
    const size = (targetPage + 1) * 30;
    const res = await forumApi.listMessages(0, size);
    const mapped = res.content.map(forumApi.toFrontendMessage).reverse();
    setMessages(mapped);
    setPage(targetPage);
    setHasMore(!res.last);
  };

  const sendMessage = async (content, image, file) => {
    const trimmed = content.trim();
    if (!trimmed && !image && !file) return;
    const tempId = `local-${Date.now()}`;
    const optimisticMessage = {
      id: tempId,
      author: currentUser,
      content: trimmed,
      image,
      file,
      likedBy: [],
      time: "Vừa xong",
      reportedByMe: false,
    };
    setMessages((prev) => [...prev, optimisticMessage]);
    try {
      const saved = await forumApi.sendMessage(trimmed, image, file);
      const mapped = forumApi.toFrontendMessage(saved);
      setMessages((prev) => prev.map((m) => (m.id === tempId ? mapped : m)));
    } catch (err) {
      console.error("Không thể gửi tin nhắn:", err);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    }
  };

  const toggleLikeMessage = async (messageId) => {
    const previous = messages;
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== messageId) return m;
        const alreadyLiked = m.likedBy.some((p) => p.id === currentUser.id);
        const likedBy = alreadyLiked
          ? m.likedBy.filter((p) => p.id !== currentUser.id)
          : [...m.likedBy, { id: currentUser.id, name: currentUser.name, avatar: currentUser.avatar }];
        return { ...m, likedBy };
      })
    );
    try {
      const saved = await forumApi.toggleLikeMessage(messageId);
      setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, likedBy: saved.likedBy } : m)));
    } catch (err) {
      console.error("Không thể thích tin nhắn:", err);
      setMessages(previous);
    }
  };

  const recallMessage = async (messageId) => {
    const previous = messages;
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, recalled: true, content: "", image: undefined, file: undefined } : m))
    );
    try {
      await forumApi.recallMessage(messageId);
    } catch (err) {
      console.error("Không thể thu hồi tin nhắn:", err);
      setMessages(previous);
    }
  };

  const reportMessage = async (messageId, reason) => {
    setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, reportedByMe: true } : m)));
    try {
      await forumApi.reportMessage(messageId, reason);
    } catch (err) {
      console.error("Không thể báo cáo tin nhắn:", err);
    }
  };

  const unreportMessage = async (messageId) => {
    setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, reportedByMe: false } : m)));
    try {
      await forumApi.unreportMessage(messageId);
    } catch (err) {
      console.error("Không thể gỡ báo cáo tin nhắn:", err);
    }
  };

  return (
    <ForumContext.Provider
      value={{
        messages,
        loading,
        hasMore,
        loadingOlder,
        loadOlderMessages,
        searchMessages,
        jumpToMessage,
        sendMessage,
        toggleLikeMessage,
        recallMessage,
        reportMessage,
        unreportMessage,
      }}
    >
      {children}
    </ForumContext.Provider>
  );
}

export function useForum() {
  const ctx = useContext(ForumContext);
  if (!ctx) throw new Error("useForum must be used within a ForumProvider");
  return ctx;
}
