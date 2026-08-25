import { createContext, useContext, useEffect, useRef, useState } from "react";
import * as chatApi from "../api/chat";
import { useCurrentUser } from "./UserContext";
import { useWebSocket } from "./WebSocketContext";
import { useToast } from "./ToastContext";

const ChatContext = createContext(null);
const TYPING_THROTTLE_MS = 2000;
const TYPING_EXPIRE_MS = 3000;

export function ChatProvider({ children }) {
  const { currentUser } = useCurrentUser();
  const { subscribe, publish } = useWebSocket();
  const { showToast } = useToast();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState({});
  const typingTimersRef = useRef({});
  const lastTypingSentRef = useRef({});

  const load = () => {
    if (!currentUser) return;
    chatApi
      .listConversations()
      .then((list) => {
        setConversations((prev) => {
          const prevById = new Map(prev.map((c) => [c.id, c]));
          return list.map((c) => {
            const mapped = chatApi.toFrontendConversation(c, currentUser.id);
            const existing = prevById.get(c.id);
            return existing?.messagesLoaded ? { ...mapped, messages: existing.messages, messagesLoaded: true } : mapped;
          });
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!currentUser) {
      setConversations([]);
      setLoading(false);
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  useEffect(() => {
    if (!currentUser) return;
    return subscribe("/user/queue/messages", (payload) => {
      const message = chatApi.toFrontendMessage(payload, currentUser.id);

      if (payload.type === "SYSTEM_DISBANDED" || payload.type === "SYSTEM_KICKED") {
        let groupName = null;
        setConversations((prev) => {
          groupName = prev.find((c) => c.id === payload.conversationId)?.user.name;
          return prev.filter((c) => c.id !== payload.conversationId);
        });
        if (groupName) {
          const text =
            payload.type === "SYSTEM_DISBANDED"
              ? `${message.senderName} đã giải tán nhóm "${groupName}"`
              : `${message.senderName} đã xoá bạn khỏi nhóm "${groupName}"`;
          showToast(text);
        }
        return;
      }

      setConversations((prev) => {
        const idx = prev.findIndex((c) => c.id === payload.conversationId);
        if (idx === -1) {
          load();
          return prev;
        }
        const conv = prev[idx];
        const updated = {
          ...conv,
          messages: conv.messagesLoaded ? [...conv.messages, message] : conv.messages,
          participants:
            payload.type === "SYSTEM_LEFT"
              ? conv.participants.filter((p) => p.id !== message.senderId)
              : conv.participants,
          lastMessage: message.system ? message.systemText : message.text || (message.image ? "Đã gửi một ảnh" : ""),
          time: "Vừa xong",
          unread: message.system ? conv.unread : conv.unread + 1,
        };
        const next = [...prev];
        next.splice(idx, 1);
        return [updated, ...next];
      });

      if (payload.type === "SYSTEM_ADDED" || payload.type === "SYSTEM_REMOVED") load();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  useEffect(() => {
    if (!currentUser) return;
    return subscribe("/user/queue/read-receipts", (payload) => {
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== payload.conversationId) return c;
          const receipts = c.readReceipts.filter((r) => r.userId !== payload.userId);
          receipts.push({ userId: payload.userId, lastReadAt: payload.lastReadAt });
          return { ...c, readReceipts: receipts };
        })
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  useEffect(() => {
    if (!currentUser) return;
    return subscribe("/user/queue/message-updates", (payload) => {
      if (!payload.recalled) return;
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== payload.conversationId) return c;
          const isLast = c.messages.length > 0 && c.messages[c.messages.length - 1].id === payload.messageId;
          return {
            ...c,
            messages: c.messages.map((m) =>
              m.id === payload.messageId ? { ...m, recalled: true, text: "", image: undefined } : m
            ),
            lastMessage: isLast ? "Tin nhắn đã được thu hồi" : c.lastMessage,
          };
        })
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  useEffect(() => {
    if (!currentUser) return;
    return subscribe("/user/queue/message-edits", (payload) => {
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== payload.conversationId) return c;
          const isLast = c.messages.length > 0 && c.messages[c.messages.length - 1].id === payload.messageId;
          return {
            ...c,
            messages: c.messages.map((m) =>
              m.id === payload.messageId ? { ...m, text: payload.text, edited: true } : m
            ),
            lastMessage: isLast ? payload.text : c.lastMessage,
          };
        })
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  useEffect(() => {
    if (!currentUser) return;
    return subscribe("/user/queue/message-likes", (payload) => {
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== payload.conversationId) return c;
          return {
            ...c,
            messages: c.messages.map((m) =>
              m.id === payload.messageId
                ? {
                    ...m,
                    likedBy: payload.likedBy,
                    liked: payload.likedBy.some((p) => p.id === currentUser.id),
                  }
                : m
            ),
          };
        })
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  useEffect(() => {
    if (!currentUser) return;
    return subscribe("/user/queue/message-pins", (payload) => {
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== payload.conversationId) return c;
          return {
            ...c,
            messages: c.messages.map((m) =>
              m.id === payload.messageId ? { ...m, pinned: payload.pinned } : m
            ),
          };
        })
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  useEffect(() => {
    if (!currentUser) return;
    return subscribe("/user/queue/typing", (payload) => {
      const { conversationId, userId, name } = payload;
      const timerKey = `${conversationId}:${userId}`;

      setTypingUsers((prev) => {
        const existing = prev[conversationId] || [];
        if (existing.some((u) => u.userId === userId)) return prev;
        return { ...prev, [conversationId]: [...existing, { userId, name }] };
      });

      clearTimeout(typingTimersRef.current[timerKey]);
      typingTimersRef.current[timerKey] = setTimeout(() => {
        setTypingUsers((prev) => ({
          ...prev,
          [conversationId]: (prev[conversationId] || []).filter((u) => u.userId !== userId),
        }));
      }, TYPING_EXPIRE_MS);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  const sendTyping = (conversationId) => {
    if (!conversationId) return;
    const now = Date.now();
    const last = lastTypingSentRef.current[conversationId] || 0;
    if (now - last < TYPING_THROTTLE_MS) return;
    lastTypingSentRef.current[conversationId] = now;
    publish("/app/chat.typing", { conversationId });
  };

  const loadMessages = async (conversationId) => {
    try {
      const page = await chatApi.listMessages(conversationId, 0, 30);
      const mapped = page.content.map((m) => chatApi.toFrontendMessage(m, currentUser.id)).reverse();
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId
            ? { ...c, messages: mapped, messagesLoaded: true, messagesPage: 0, hasMoreMessages: !page.last }
            : c
        )
      );
    } catch (err) {
      console.error("Không thể tải tin nhắn:", err);
    }
  };

  const loadOlderMessages = async (conversationId) => {
    const conv = conversations.find((c) => c.id === conversationId);
    if (!conv || !conv.hasMoreMessages || conv.loadingOlderMessages) return;

    setConversations((prev) =>
      prev.map((c) => (c.id === conversationId ? { ...c, loadingOlderMessages: true } : c))
    );
    try {
      const nextPage = conv.messagesPage + 1;
      const page = await chatApi.listMessages(conversationId, nextPage, 30);
      const older = page.content.map((m) => chatApi.toFrontendMessage(m, currentUser.id)).reverse();
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId
            ? {
                ...c,
                messages: [...older, ...c.messages],
                messagesPage: nextPage,
                hasMoreMessages: !page.last,
                loadingOlderMessages: false,
              }
            : c
        )
      );
    } catch (err) {
      console.error("Không thể tải tin nhắn cũ hơn:", err);
      setConversations((prev) =>
        prev.map((c) => (c.id === conversationId ? { ...c, loadingOlderMessages: false } : c))
      );
    }
  };

  const searchMessages = async (conversationId, query) => {
    if (!query.trim()) return [];
    const page = await chatApi.searchMessages(conversationId, query.trim());
    return page.content.map((m) => chatApi.toFrontendMessage(m, currentUser.id));
  };

  const jumpToMessage = async (conversationId, messageId) => {
    const { page: targetPage } = await chatApi.locateMessagePage(conversationId, messageId, 30);
    const size = (targetPage + 1) * 30;
    const page = await chatApi.listMessages(conversationId, 0, size);
    const mapped = page.content.map((m) => chatApi.toFrontendMessage(m, currentUser.id)).reverse();
    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversationId
          ? { ...c, messages: mapped, messagesLoaded: true, messagesPage: targetPage, hasMoreMessages: !page.last }
          : c
      )
    );
  };

  const sendMessage = async (conversationId, text, image, file, replyTo) => {
    const trimmed = text.trim();
    if (!trimmed && !image && !file) return;
    const tempId = `local-${Date.now()}`;
    const optimisticMessage = {
      id: tempId,
      from: "me",
      senderId: currentUser.id,
      text: trimmed,
      image,
      file,
      replyTo: replyTo
        ? {
            id: replyTo.id,
            senderName: replyTo.senderName,
            text: replyTo.text,
            hasImage: !!replyTo.image,
            hasFile: !!replyTo.file,
            recalled: !!replyTo.recalled,
          }
        : undefined,
      time: "Vừa xong",
      likedBy: [],
      liked: false,
      reportedByMe: false,
    };
    const preview = trimmed || (image ? "Đã gửi một ảnh" : file?.type?.startsWith("video/") ? "Đã gửi một video" : "Đã gửi một tệp");
    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversationId
          ? {
              ...c,
              messages: [...c.messages, optimisticMessage],
              lastMessage: preview,
              time: "Vừa xong",
            }
          : c
      )
    );
    try {
      const saved = await chatApi.sendMessage(conversationId, trimmed, image, file, replyTo?.id);
      const mapped = chatApi.toFrontendMessage(saved, currentUser.id);
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId
            ? { ...c, messages: c.messages.map((m) => (m.id === tempId ? mapped : m)) }
            : c
        )
      );
    } catch (err) {
      console.error("Không thể gửi tin nhắn:", err);
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId ? { ...c, messages: c.messages.filter((m) => m.id !== tempId) } : c
        )
      );
    }
  };

  const forwardMessage = async (targetConversationId, sourceMessageId) => {
    const saved = await chatApi.forwardMessage(targetConversationId, sourceMessageId);
    const mapped = chatApi.toFrontendMessage(saved, currentUser.id);
    const preview = mapped.text || (mapped.image ? "Đã gửi một ảnh" : mapped.file?.type?.startsWith("video/") ? "Đã gửi một video" : "Đã gửi một tệp");
    setConversations((prev) =>
      prev.map((c) =>
        c.id === targetConversationId
          ? {
              ...c,
              messages: c.messagesLoaded ? [...c.messages, mapped] : c.messages,
              lastMessage: preview,
              time: "Vừa xong",
            }
          : c
      )
    );
  };

  const recallMessage = async (conversationId, messageId) => {
    const previous = conversations;
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== conversationId) return c;
        const isLast = c.messages.length > 0 && c.messages[c.messages.length - 1].id === messageId;
        return {
          ...c,
          messages: c.messages.map((m) =>
            m.id === messageId ? { ...m, recalled: true, text: "", image: undefined } : m
          ),
          lastMessage: isLast ? "Tin nhắn đã được thu hồi" : c.lastMessage,
        };
      })
    );
    try {
      await chatApi.recallMessage(conversationId, messageId);
    } catch (err) {
      console.error("Không thể thu hồi tin nhắn:", err);
      setConversations(previous);
    }
  };

  const editMessage = async (conversationId, messageId, text) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const previous = conversations;
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== conversationId) return c;
        const isLast = c.messages.length > 0 && c.messages[c.messages.length - 1].id === messageId;
        return {
          ...c,
          messages: c.messages.map((m) => (m.id === messageId ? { ...m, text: trimmed, edited: true } : m)),
          lastMessage: isLast ? trimmed : c.lastMessage,
        };
      })
    );
    try {
      await chatApi.editMessage(conversationId, messageId, trimmed);
    } catch (err) {
      console.error("Không thể chỉnh sửa tin nhắn:", err);
      setConversations(previous);
    }
  };

  const markRead = async (conversationId) => {
    const conv = conversations.find((c) => c.id === conversationId);
    if (!conv?.messagesLoaded) await loadMessages(conversationId);
    setConversations((prev) => prev.map((c) => (c.id === conversationId ? { ...c, unread: 0 } : c)));
    try {
      await chatApi.markRead(conversationId);
    } catch (err) {
      console.error("Không thể đánh dấu đã đọc:", err);
    }
  };

  const toggleLikeMessage = async (conversationId, messageId) => {
    const previous = conversations;
    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversationId
          ? {
              ...c,
              messages: c.messages.map((m) => {
                if (m.id !== messageId) return m;
                const alreadyLiked = m.liked;
                const likedBy = alreadyLiked
                  ? m.likedBy.filter((p) => p.id !== currentUser.id)
                  : [...m.likedBy, { id: currentUser.id, name: currentUser.name, avatar: currentUser.avatar }];
                return { ...m, liked: !alreadyLiked, likedBy };
              }),
            }
          : c
      )
    );
    try {
      const saved = await chatApi.toggleLikeMessage(conversationId, messageId);
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId
            ? {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === messageId
                    ? { ...m, likedBy: saved.likedBy, liked: saved.likedBy.some((p) => p.id === currentUser.id) }
                    : m
                ),
              }
            : c
        )
      );
    } catch (err) {
      console.error("Không thể thích tin nhắn:", err);
      setConversations(previous);
    }
  };

  const togglePinMessage = async (conversationId, messageId) => {
    const previous = conversations;
    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversationId
          ? {
              ...c,
              messages: c.messages.map((m) => (m.id === messageId ? { ...m, pinned: !m.pinned } : m)),
            }
          : c
      )
    );
    try {
      const saved = await chatApi.togglePin(conversationId, messageId);
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId
            ? { ...c, messages: c.messages.map((m) => (m.id === messageId ? { ...m, pinned: saved.pinned } : m)) }
            : c
        )
      );
    } catch (err) {
      console.error("Không thể ghim tin nhắn:", err);
      setConversations(previous);
    }
  };

  const loadPinnedMessages = async (conversationId) => {
    const list = await chatApi.listPinnedMessages(conversationId);
    return list.map((m) => chatApi.toFrontendMessage(m, currentUser.id));
  };

  const reportMessage = async (conversationId, messageId, reason) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversationId
          ? { ...c, messages: c.messages.map((m) => (m.id === messageId ? { ...m, reportedByMe: true } : m)) }
          : c
      )
    );
    try {
      await chatApi.reportMessage(conversationId, messageId, reason);
    } catch (err) {
      console.error("Không thể báo cáo tin nhắn:", err);
    }
  };

  const unreportMessage = async (conversationId, messageId) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversationId
          ? { ...c, messages: c.messages.map((m) => (m.id === messageId ? { ...m, reportedByMe: false } : m)) }
          : c
      )
    );
    try {
      await chatApi.unreportMessage(conversationId, messageId);
    } catch (err) {
      console.error("Không thể gỡ báo cáo tin nhắn:", err);
    }
  };

  const toggleMute = async (conversationId) => {
    const previous = conversations;
    const conv = conversations.find((c) => c.id === conversationId);
    const nextMuted = !conv?.muted;
    setConversations((prev) =>
      prev.map((c) => (c.id === conversationId ? { ...c, muted: nextMuted } : c))
    );
    try {
      await chatApi.setMuted(conversationId, nextMuted);
    } catch (err) {
      console.error("Không thể đổi trạng thái tắt thông báo:", err);
      setConversations(previous);
    }
  };

  const deleteConversation = async (conversationId) => {
    const previous = conversations;
    setConversations((prev) => prev.filter((c) => c.id !== conversationId));
    try {
      await chatApi.clearConversation(conversationId);
    } catch (err) {
      console.error("Không thể xoá cuộc trò chuyện:", err);
      setConversations(previous);
    }
  };

  const leaveGroup = async (conversationId) => {
    const previous = conversations;
    setConversations((prev) => prev.filter((c) => c.id !== conversationId));
    try {
      await chatApi.leaveGroup(conversationId);
    } catch (err) {
      console.error("Không thể rời nhóm:", err);
      setConversations(previous);
    }
  };

  const disbandGroup = async (conversationId) => {
    const previous = conversations;
    setConversations((prev) => prev.filter((c) => c.id !== conversationId));
    try {
      await chatApi.disbandGroup(conversationId);
    } catch (err) {
      console.error("Không thể giải tán nhóm:", err);
      setConversations(previous);
    }
  };

  const addMembers = async (conversationId, memberIds) => {
    const c = await chatApi.addMembers(conversationId, memberIds);
    const mapped = chatApi.toFrontendConversation(c, currentUser.id);
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === conversationId ? { ...conv, participants: mapped.participants } : conv
      )
    );
  };

  const removeMember = async (conversationId, memberId) => {
    const previous = conversations;
    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversationId
          ? { ...c, participants: c.participants.filter((p) => p.id !== memberId) }
          : c
      )
    );
    try {
      await chatApi.removeMember(conversationId, memberId);
    } catch (err) {
      console.error("Không thể xoá thành viên:", err);
      setConversations(previous);
    }
  };

  const openDirectConversation = async (otherUserId) => {
    const c = await chatApi.createDirectConversation(otherUserId);
    const mapped = chatApi.toFrontendConversation(c, currentUser.id);
    setConversations((prev) => {
      if (prev.some((existing) => existing.id === mapped.id)) return prev;
      return [mapped, ...prev];
    });
    return mapped.id;
  };

  const createGroup = async (name, memberIds) => {
    const c = await chatApi.createGroupConversation(name, memberIds);
    const mapped = chatApi.toFrontendConversation(c, currentUser.id);
    setConversations((prev) => [mapped, ...prev]);
    return mapped.id;
  };

  const totalUnread = conversations.reduce((sum, c) => sum + (c.muted ? 0 : c.unread), 0);

  return (
    <ChatContext.Provider
      value={{
        conversations,
        loading,
        loadMessages,
        loadOlderMessages,
        searchMessages,
        jumpToMessage,
        typingUsers,
        sendTyping,
        sendMessage,
        forwardMessage,
        recallMessage,
        editMessage,
        markRead,
        toggleLikeMessage,
        togglePinMessage,
        loadPinnedMessages,
        reportMessage,
        unreportMessage,
        toggleMute,
        deleteConversation,
        leaveGroup,
        disbandGroup,
        addMembers,
        removeMember,
        openDirectConversation,
        createGroup,
        totalUnread,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within a ChatProvider");
  return ctx;
}
