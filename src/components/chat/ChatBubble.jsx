import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FaCommentDots,
  FaArrowLeft,
  FaTimes,
  FaPaperPlane,
  FaHeart,
  FaRegHeart,
  FaEllipsisH,
  FaFlag,
  FaUserFriends,
  FaUndoAlt,
  FaImage,
  FaPaperclip,
  FaSearch,
  FaReply,
  FaShare,
  FaThumbtack,
  FaPen,
  FaCheck,
} from "react-icons/fa";
import { useChat } from "../../context/ChatContext";
import { useCurrentUser } from "../../context/UserContext";
import { useToast } from "../../context/ToastContext";
import { uploadImage, uploadFile } from "../../api/uploads";
import { formatFileSize } from "../../utils/file";
import { replyPreviewText } from "../../api/chat";
import Avatar from "../common/Avatar";
import AnchoredMenu from "../common/AnchoredMenu";
import ImageLightbox from "../common/ImageLightbox";
import MessageAttachment from "./MessageAttachment";
import ForwardMessageModal from "./ForwardMessageModal";

const reportReasons = ["Spam", "Nội dung không phù hợp", "Quấy rối / thù ghét", "Khác"];

export default function ChatBubble() {
  const [open, setOpen] = useState(false);
  const [activeChatId, setActiveChatId] = useState(null);
  const [text, setText] = useState("");
  const [pendingImage, setPendingImage] = useState(null);
  const [pendingFile, setPendingFile] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [reportMenuFor, setReportMenuFor] = useState(null);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [msgSearchOpen, setMsgSearchOpen] = useState(false);
  const [msgSearchQuery, setMsgSearchQuery] = useState("");
  const [msgSearchResults, setMsgSearchResults] = useState([]);
  const [msgSearching, setMsgSearching] = useState(false);
  const [highlightedMessageId, setHighlightedMessageId] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [forwardingMessage, setForwardingMessage] = useState(null);
  const [pinnedPanelOpen, setPinnedPanelOpen] = useState(false);
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [pinnedLoading, setPinnedLoading] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const containerRef = useRef(null);
  const reportButtonRefs = useRef({});
  const fileInputRef = useRef(null);
  const attachmentInputRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const prevScrollHeightRef = useRef(null);
  const location = useLocation();
  const { currentUser } = useCurrentUser();
  const { showToast } = useToast();
  const {
    conversations,
    sendMessage,
    forwardMessage,
    recallMessage,
    editMessage,
    markRead,
    loadMessages,
    loadOlderMessages,
    searchMessages,
    jumpToMessage,
    typingUsers,
    sendTyping,
    toggleLikeMessage,
    togglePinMessage,
    loadPinnedMessages,
    reportMessage,
    unreportMessage,
    totalUnread,
  } = useChat();

  const active = conversations.find((c) => c.id === activeChatId);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    const onKeyDown = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const getReportButtonRef = (id) => {
    if (!reportButtonRefs.current[id]) reportButtonRefs.current[id] = { current: null };
    return reportButtonRefs.current[id];
  };

  useEffect(() => {
    if (!active?.messagesLoaded || !messagesContainerRef.current) return;
    if (prevScrollHeightRef.current !== null) {
      const container = messagesContainerRef.current;
      container.scrollTop = container.scrollHeight - prevScrollHeightRef.current;
      prevScrollHeightRef.current = null;
    } else {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChatId, active?.messages.length]);

  const handleMessagesScroll = () => {
    const container = messagesContainerRef.current;
    if (!container || !active) return;
    if (container.scrollTop < 60 && active.hasMoreMessages && !active.loadingOlderMessages) {
      prevScrollHeightRef.current = container.scrollHeight;
      loadOlderMessages(activeChatId);
    }
  };

  useEffect(() => {
    if (!msgSearchOpen || !msgSearchQuery.trim() || !activeChatId) {
      setMsgSearchResults([]);
      return;
    }
    setMsgSearching(true);
    const handle = setTimeout(() => {
      searchMessages(activeChatId, msgSearchQuery)
        .then((results) => setMsgSearchResults(results))
        .catch((err) => console.error("Không thể tìm kiếm tin nhắn:", err))
        .finally(() => setMsgSearching(false));
    }, 300);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [msgSearchQuery, msgSearchOpen, activeChatId]);

  useEffect(() => {
    if (!pinnedPanelOpen || !activeChatId) return;
    setPinnedLoading(true);
    loadPinnedMessages(activeChatId)
      .then((list) => setPinnedMessages(list))
      .catch((err) => console.error("Không thể tải tin nhắn đã ghim:", err))
      .finally(() => setPinnedLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pinnedPanelOpen, activeChatId]);

  useEffect(() => {
    if (!highlightedMessageId || !messagesContainerRef.current) return;
    const el = messagesContainerRef.current.querySelector(`[data-message-id="${highlightedMessageId}"]`);
    el?.scrollIntoView({ block: "center" });
    const handle = setTimeout(() => setHighlightedMessageId(null), 2000);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlightedMessageId, active?.messages.length]);

  const handleJumpToResult = async (messageId) => {
    try {
      await jumpToMessage(activeChatId, messageId);
      setMsgSearchOpen(false);
      setMsgSearchQuery("");
      setMsgSearchResults([]);
      setHighlightedMessageId(messageId);
    } catch (err) {
      console.error("Không thể chuyển đến tin nhắn:", err);
    }
  };

  const openConversation = (id) => {
    setActiveChatId(id);
    prevScrollHeightRef.current = null;
    const conv = conversations.find((c) => c.id === id);
    if (conv && !conv.messagesLoaded) loadMessages(id);
    markRead(id);
  };

  const closeBubble = () => {
    setOpen(false);
    setActiveChatId(null);
    setReportMenuFor(null);
    setPendingImage(null);
    setPendingFile(null);
    setMsgSearchOpen(false);
    setMsgSearchQuery("");
    setMsgSearchResults([]);
    setReplyingTo(null);
    setForwardingMessage(null);
    setPinnedPanelOpen(false);
    setPinnedMessages([]);
    setEditingMessageId(null);
    setEditingText("");
  };

  const send = () => {
    if ((!text.trim() && !pendingImage && !pendingFile) || !activeChatId) return;
    sendMessage(activeChatId, text, pendingImage, pendingFile, replyingTo);
    setText("");
    setPendingImage(null);
    setPendingFile(null);
    setReplyingTo(null);
  };

  const handleJumpToReply = async (messageId) => {
    if (active?.messages.some((m) => m.id === messageId)) {
      setHighlightedMessageId(messageId);
      return;
    }
    try {
      await jumpToMessage(activeChatId, messageId);
      setHighlightedMessageId(messageId);
    } catch (err) {
      console.error("Không thể chuyển đến tin nhắn:", err);
    }
  };

  const handleForward = async (targetConversationIds) => {
    for (const targetId of targetConversationIds) {
      await forwardMessage(targetId, forwardingMessage.id);
    }
    setForwardingMessage(null);
    showToast(
      targetConversationIds.length === 1 ? "Đã chuyển tiếp tin nhắn" : `Đã chuyển tiếp đến ${targetConversationIds.length} cuộc trò chuyện`
    );
  };

  const handleTogglePin = async (messageId) => {
    await togglePinMessage(activeChatId, messageId);
    setPinnedMessages((prev) => prev.filter((m) => m.id !== messageId));
  };

  const startEditing = (m) => {
    setEditingMessageId(m.id);
    setEditingText(m.text);
  };

  const cancelEditing = () => {
    setEditingMessageId(null);
    setEditingText("");
  };

  const saveEditing = async () => {
    if (!editingText.trim()) return;
    await editMessage(activeChatId, editingMessageId, editingText);
    setEditingMessageId(null);
    setEditingText("");
  };

  const handleJumpToPinned = async (messageId) => {
    setPinnedPanelOpen(false);
    if (active?.messages.some((m) => m.id === messageId)) {
      setHighlightedMessageId(messageId);
      return;
    }
    try {
      await jumpToMessage(activeChatId, messageId);
      setHighlightedMessageId(messageId);
    } catch (err) {
      console.error("Không thể chuyển đến tin nhắn:", err);
    }
  };

  const pickImage = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadingImage(true);
    try {
      const url = await uploadImage(file);
      setPendingImage(url);
      setPendingFile(null);
    } catch (err) {
      console.error("Không thể tải ảnh lên:", err);
    } finally {
      setUploadingImage(false);
    }
  };

  const pickAttachment = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadingImage(true);
    try {
      const uploaded = await uploadFile(file);
      setPendingFile({ url: uploaded.url, name: uploaded.name, size: uploaded.size, type: uploaded.contentType });
      setPendingImage(null);
    } catch (err) {
      console.error("Không thể tải tệp lên:", err);
    } finally {
      setUploadingImage(false);
    }
  };

  if (location.pathname.startsWith("/chat")) return null;

  return (
    <div ref={containerRef} className="fixed bottom-6 right-6 z-40">
      {open && (
        <div className="absolute bottom-16 right-0 w-80 h-[26rem] flex flex-col overflow-hidden bg-zm-card rounded-2xl border border-zm-border shadow-2xl glow-violet">
          {!active ? (
            <>
              <div className="px-4 py-3 border-b border-zm-border font-bold text-lg shrink-0">
                Đoạn chat
              </div>
              <div className="flex-1 overflow-y-auto">
                {conversations.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => openConversation(c.id)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-zm-hover text-left transition-colors"
                  >
                    <div className="relative shrink-0">
                      {c.group && !c.user.avatar ? (
                        <div className="w-11 h-11 rounded-full bg-zm-blue/20 text-zm-blue-light flex items-center justify-center">
                          <FaUserFriends size={16} aria-hidden="true" />
                        </div>
                      ) : (
                        <Avatar src={c.user.avatar} alt="" className="w-11 h-11" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm truncate ${c.unread ? "font-bold" : "font-medium"}`}>
                        {c.user.name}
                      </p>
                      <p className={`text-xs truncate ${c.unread ? "text-zm-text font-semibold" : "text-zm-muted"}`}>
                        {c.lastMessage} · {c.time}
                      </p>
                    </div>
                    {c.unread > 0 && (
                      <span
                        aria-hidden="true"
                        className="bg-gradient-to-br from-zm-blue to-zm-blue-light text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shrink-0"
                      >
                        {c.unread}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="relative shrink-0">
              <div className="flex items-center gap-2 px-3 py-2.5 border-b border-zm-border">
                <button
                  type="button"
                  onClick={() => {
                    setActiveChatId(null);
                    setMsgSearchOpen(false);
                    setMsgSearchQuery("");
                    setMsgSearchResults([]);
                    setReplyingTo(null);
                    setForwardingMessage(null);
                    setPinnedPanelOpen(false);
                    setPinnedMessages([]);
                  }}
                  aria-label="Quay lại danh sách hội thoại"
                  className="w-11 h-11 flex items-center justify-center shrink-0 rounded-full hover:bg-zm-hover text-zm-muted hover:text-zm-blue-light"
                >
                  <FaArrowLeft size={14} aria-hidden="true" />
                </button>
                {active.group ? (
                  <>
                    {active.user.avatar ? (
                      <Avatar src={active.user.avatar} alt="" className="w-8 h-8 shrink-0" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-zm-blue/20 text-zm-blue-light flex items-center justify-center shrink-0">
                        <FaUserFriends size={13} aria-hidden="true" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate">{active.user.name}</p>
                      <p className="text-[11px] text-zm-muted">{active.participants.length} thành viên</p>
                    </div>
                  </>
                ) : (
                  <>
                    <Link to={`/profile/${active.user.id}`} className="relative shrink-0">
                      <Avatar src={active.user.avatar} alt="" className="w-8 h-8" />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <Link to={`/profile/${active.user.id}`} className="text-sm font-semibold truncate block hover:text-zm-blue-light">
                        {active.user.name}
                      </Link>
                      <p className="text-[11px] text-zm-muted">Nhắn tin trực tiếp</p>
                    </div>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setMsgSearchOpen((v) => !v)}
                  aria-label="Tìm kiếm tin nhắn"
                  aria-expanded={msgSearchOpen}
                  className={`w-11 h-11 flex items-center justify-center shrink-0 rounded-full hover:bg-zm-hover text-zm-muted hover:text-zm-blue-light ${
                    msgSearchOpen ? "bg-zm-hover text-zm-blue-light" : ""
                  }`}
                >
                  <FaSearch size={13} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => setPinnedPanelOpen((v) => !v)}
                  aria-label="Tin nhắn đã ghim"
                  aria-expanded={pinnedPanelOpen}
                  className={`w-11 h-11 flex items-center justify-center shrink-0 rounded-full hover:bg-zm-hover text-zm-muted hover:text-zm-blue-light ${
                    pinnedPanelOpen ? "bg-zm-hover text-zm-blue-light" : ""
                  }`}
                >
                  <FaThumbtack size={12} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={closeBubble}
                  aria-label="Đóng cửa sổ chat"
                  className="w-11 h-11 flex items-center justify-center shrink-0 rounded-full hover:bg-zm-hover text-zm-muted"
                >
                  <FaTimes size={14} aria-hidden="true" />
                </button>
              </div>

              {msgSearchOpen && (
                <div className="absolute top-full left-0 right-0 z-20 bg-zm-card border-b border-zm-border shadow-2xl max-h-72 flex flex-col glow-violet">
                  <div className="p-2 border-b border-zm-border flex items-center gap-1.5 shrink-0">
                    <FaSearch className="text-zm-muted text-[10px] shrink-0 ml-1" aria-hidden="true" />
                    <input
                      autoFocus
                      value={msgSearchQuery}
                      onChange={(e) => setMsgSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") {
                          e.stopPropagation();
                          setMsgSearchOpen(false);
                        }
                      }}
                      aria-label="Nhập từ khoá tìm kiếm tin nhắn"
                      placeholder="Tìm kiếm tin nhắn..."
                      className="flex-1 min-w-0 bg-transparent outline-none text-xs placeholder-zm-muted"
                    />
                    <button
                      type="button"
                      onClick={() => setMsgSearchOpen(false)}
                      aria-label="Đóng tìm kiếm"
                      className="w-11 h-11 flex items-center justify-center text-zm-muted hover:text-zm-heart"
                    >
                      <FaTimes size={11} aria-hidden="true" />
                    </button>
                  </div>
                  <div className="overflow-y-auto">
                    {msgSearching && <p className="text-[11px] text-zm-muted text-center py-3">Đang tìm kiếm...</p>}
                    {!msgSearching && msgSearchQuery.trim() && msgSearchResults.length === 0 && (
                      <p className="text-[11px] text-zm-muted text-center py-3">Không tìm thấy tin nhắn nào.</p>
                    )}
                    {!msgSearching &&
                      msgSearchResults.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => handleJumpToResult(m.id)}
                          className="w-full text-left px-3 py-2 hover:bg-zm-hover transition-colors flex items-start gap-2 border-b border-zm-border last:border-b-0"
                        >
                          <Avatar src={m.senderAvatar} alt="" className="w-6 h-6 shrink-0 mt-0.5" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-baseline gap-1.5">
                              <p className="text-[11px] font-semibold truncate">{m.senderName}</p>
                              <p className="text-[9px] text-zm-muted shrink-0">{m.time}</p>
                            </div>
                            <p className="text-[11px] text-zm-muted truncate">{m.text}</p>
                          </div>
                        </button>
                      ))}
                  </div>
                </div>
              )}

              {pinnedPanelOpen && (
                <div className="absolute top-full left-0 right-0 z-20 bg-zm-card border-b border-zm-border shadow-2xl max-h-72 flex flex-col glow-violet">
                  <div className="p-2 border-b border-zm-border flex items-center justify-between shrink-0">
                    <p className="text-xs font-semibold px-1 flex items-center gap-1.5">
                      <FaThumbtack size={10} aria-hidden="true" /> Tin nhắn đã ghim
                    </p>
                    <button
                      type="button"
                      onClick={() => setPinnedPanelOpen(false)}
                      aria-label="Đóng danh sách ghim"
                      className="w-11 h-11 flex items-center justify-center text-zm-muted hover:text-zm-heart"
                    >
                      <FaTimes size={11} aria-hidden="true" />
                    </button>
                  </div>
                  <div className="overflow-y-auto">
                    {pinnedLoading && <p className="text-[11px] text-zm-muted text-center py-3">Đang tải...</p>}
                    {!pinnedLoading && pinnedMessages.length === 0 && (
                      <p className="text-[11px] text-zm-muted text-center py-3">Chưa có tin nhắn nào được ghim.</p>
                    )}
                    {!pinnedLoading &&
                      pinnedMessages.map((m) => (
                        <div
                          key={m.id}
                          className="group flex items-start gap-2 px-3 py-2 hover:bg-zm-hover transition-colors border-b border-zm-border last:border-b-0"
                        >
                          <button type="button" onClick={() => handleJumpToPinned(m.id)} className="flex items-start gap-2 flex-1 min-w-0 text-left">
                            <Avatar src={m.senderAvatar} alt="" className="w-6 h-6 shrink-0 mt-0.5" />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-baseline gap-1.5">
                                <p className="text-[11px] font-semibold truncate">{m.senderName}</p>
                                <p className="text-[9px] text-zm-muted shrink-0">{m.time}</p>
                              </div>
                              <p className="text-[11px] text-zm-muted truncate">
                                {m.text || (m.image ? "Đã gửi một ảnh" : m.file ? "Đã gửi một tệp đính kèm" : "")}
                              </p>
                            </div>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleTogglePin(m.id)}
                            aria-label="Bỏ ghim tin nhắn"
                            className="w-11 h-11 flex items-center justify-center rounded-full text-zm-blue-light hover:bg-zm-hover shrink-0"
                          >
                            <FaThumbtack size={10} aria-hidden="true" />
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              )}
              </div>

              <div
                ref={messagesContainerRef}
                onScroll={handleMessagesScroll}
                className="flex-1 overflow-y-auto p-3 flex flex-col gap-1.5 bg-zm-bg/40"
              >
                {active.loadingOlderMessages && (
                  <div className="text-center text-[10px] text-zm-muted py-1">Đang tải tin nhắn cũ hơn...</div>
                )}
                {active.messages.map((m, i) => {
                  if (m.system) {
                    return (
                      <div key={m.id} className="text-center text-[11px] text-zm-muted py-1">
                        {m.systemText}
                      </div>
                    );
                  }
                  const isFirstInGroup = i === 0 || active.messages[i - 1].senderId !== m.senderId;
                  const isReported = m.reportedByMe;
                  if (m.recalled) {
                    return (
                      <div
                        key={m.id}
                        data-message-id={m.id}
                        className={`flex max-w-[85%] rounded-2xl transition-colors duration-1000 ${
                          m.from === "me" ? "self-end" : "self-start"
                        } ${highlightedMessageId === m.id ? "bg-zm-blue/20" : ""}`}
                      >
                        <div className="px-3 py-1.5 rounded-2xl text-sm italic text-zm-muted border border-zm-border">
                          Tin nhắn đã được thu hồi
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div
                      key={m.id}
                      data-message-id={m.id}
                      className={`group flex items-center gap-1 max-w-[85%] rounded-2xl transition-colors duration-1000 ${
                        m.from === "me" ? "self-end flex-row-reverse" : "self-start"
                      } ${highlightedMessageId === m.id ? "bg-zm-blue/20" : ""}`}
                    >
                      <div>
                        {active.group && m.from === "them" && isFirstInGroup && (
                          <p className="text-[10px] text-zm-muted px-1 mb-0.5">{m.senderName}</p>
                        )}
                        {m.forwarded && (
                          <p className="flex items-center gap-1 text-[9px] text-zm-muted italic px-1 mb-0.5">
                            <FaShare size={8} aria-hidden="true" /> Tin nhắn đã chuyển tiếp
                          </p>
                        )}
                        {m.pinned && (
                          <p className="flex items-center gap-1 text-[9px] text-zm-blue-light italic px-1 mb-0.5">
                            <FaThumbtack size={8} aria-hidden="true" /> Đã ghim
                          </p>
                        )}
                        {m.replyTo && (
                          <button
                            type="button"
                            onClick={() => handleJumpToReply(m.replyTo.id)}
                            className="block w-full text-left mb-1 pl-1.5 pr-2 py-0.5 border-l-2 border-zm-blue-light bg-zm-hover/60 hover:bg-zm-hover rounded-md transition-colors"
                          >
                            <p className="text-[10px] font-semibold text-zm-blue-light truncate">{m.replyTo.senderName}</p>
                            <p className="text-[10px] text-zm-muted truncate italic">{replyPreviewText(m.replyTo)}</p>
                          </button>
                        )}
                        {m.image && (
                          <img
                            src={m.image}
                            alt="Ảnh đính kèm trong tin nhắn"
                            onClick={() => setLightboxImage(m.image)}
                            className="max-w-[160px] rounded-2xl border border-zm-border mb-1 cursor-pointer"
                          />
                        )}
                        {m.file && <MessageAttachment file={m.file} compact />}
                        {editingMessageId === m.id ? (
                          <div className="flex items-center gap-1 min-w-[160px]">
                            <input
                              autoFocus
                              value={editingText}
                              onChange={(e) => setEditingText(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") saveEditing();
                                if (e.key === "Escape") {
                                  e.stopPropagation();
                                  cancelEditing();
                                }
                              }}
                              aria-label="Chỉnh sửa nội dung tin nhắn"
                              className="flex-1 min-w-0 bg-zm-bg border border-zm-blue-light rounded-full px-2.5 py-1 text-xs outline-none"
                            />
                            <button
                              type="button"
                              onClick={saveEditing}
                              aria-label="Lưu chỉnh sửa"
                              className="w-11 h-11 flex items-center justify-center text-zm-blue-light hover:bg-zm-hover rounded-full shrink-0"
                            >
                              <FaCheck size={10} aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              onClick={cancelEditing}
                              aria-label="Huỷ chỉnh sửa"
                              className="w-11 h-11 flex items-center justify-center text-zm-muted hover:text-zm-heart rounded-full shrink-0"
                            >
                              <FaTimes size={10} aria-hidden="true" />
                            </button>
                          </div>
                        ) : (
                          m.text && (
                            <div
                              className={`px-3 py-1.5 rounded-2xl text-sm ${
                                m.from === "me"
                                  ? "bg-gradient-to-br from-zm-blue to-zm-blue-dark text-white rounded-br-sm"
                                  : "bg-zm-card border border-zm-border rounded-bl-sm"
                              }`}
                            >
                              {m.text}
                              {m.edited && (
                                <span className={`text-[9px] italic ml-1 ${m.from === "me" ? "text-white/70" : "text-zm-muted"}`}>
                                  (đã sửa)
                                </span>
                              )}
                            </div>
                          )
                        )}
                        {m.likedBy?.length > 0 && (
                          <div
                            className={`flex items-center gap-1 ${m.from === "me" ? "justify-end" : "justify-start"} px-1`}
                            aria-label={`${m.likedBy.map((p) => p.name).join(", ")} đã thả tim tin nhắn này`}
                          >
                            <FaHeart className="text-zm-heart" size={10} aria-hidden="true" />
                            {m.likedBy.length > 1 && (
                              <span className="text-[9px] text-zm-muted">{m.likedBy.length}</span>
                            )}
                          </div>
                        )}
                        <div className={`text-[9px] text-zm-muted px-1 ${m.from === "me" ? "text-right" : "text-left"}`}>
                          {m.time}
                        </div>
                        {i === active.messages.length - 1 &&
                          m.from === "me" &&
                          (() => {
                            const seenBy = active.readReceipts.filter(
                              (r) =>
                                r.userId !== currentUser.id &&
                                r.lastReadAt &&
                                new Date(r.lastReadAt) >= new Date(m.createdAt)
                            ).length;
                            if (seenBy === 0) return null;
                            return (
                              <div className="text-[9px] text-zm-muted text-right px-1">
                                {active.group ? `${seenBy} người đã xem` : "Đã xem"}
                              </div>
                            );
                          })()}
                      </div>

                      <div className="relative flex items-center shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => setReplyingTo(m)}
                          aria-label="Trả lời tin nhắn"
                          className="w-11 h-11 flex items-center justify-center rounded-full text-zm-muted hover:text-zm-blue-light hover:bg-zm-hover"
                        >
                          <FaReply size={10} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setForwardingMessage(m)}
                          aria-label="Chuyển tiếp tin nhắn"
                          className="w-11 h-11 flex items-center justify-center rounded-full text-zm-muted hover:text-zm-blue-light hover:bg-zm-hover"
                        >
                          <FaShare size={10} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => togglePinMessage(activeChatId, m.id)}
                          aria-label={m.pinned ? "Bỏ ghim tin nhắn" : "Ghim tin nhắn"}
                          className={`w-11 h-11 flex items-center justify-center rounded-full hover:bg-zm-hover ${
                            m.pinned ? "text-zm-blue-light" : "text-zm-muted hover:text-zm-blue-light"
                          }`}
                        >
                          <FaThumbtack size={10} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleLikeMessage(activeChatId, m.id)}
                          aria-label={m.liked ? "Bỏ thả tim tin nhắn" : "Thả tim tin nhắn"}
                          className="w-11 h-11 flex items-center justify-center rounded-full text-zm-muted hover:text-zm-heart hover:bg-zm-hover"
                        >
                          {m.liked ? <FaHeart className="text-zm-heart" size={10} aria-hidden="true" /> : <FaRegHeart size={10} aria-hidden="true" />}
                        </button>

                        {m.from === "me" && m.text && (
                          <button
                            type="button"
                            onClick={() => startEditing(m)}
                            aria-label="Chỉnh sửa tin nhắn"
                            className="w-11 h-11 flex items-center justify-center rounded-full text-zm-muted hover:text-zm-blue-light hover:bg-zm-hover"
                          >
                            <FaPen size={9} aria-hidden="true" />
                          </button>
                        )}

                        {m.from === "me" && (
                          <button
                            type="button"
                            onClick={() => recallMessage(activeChatId, m.id)}
                            aria-label="Thu hồi tin nhắn"
                            className="w-11 h-11 flex items-center justify-center rounded-full text-zm-muted hover:text-zm-heart hover:bg-zm-hover"
                          >
                            <FaUndoAlt size={9} aria-hidden="true" />
                          </button>
                        )}

                        {m.from === "them" && (
                          <>
                            <button
                              ref={(el) => {
                                getReportButtonRef(m.id).current = el;
                              }}
                              type="button"
                              onClick={() =>
                                isReported
                                  ? unreportMessage(activeChatId, m.id)
                                  : setReportMenuFor(reportMenuFor === m.id ? null : m.id)
                              }
                              aria-label={isReported ? "Gỡ báo cáo tin nhắn này" : "Báo cáo tin nhắn"}
                              aria-haspopup={isReported ? undefined : "true"}
                              className={`w-11 h-11 flex items-center justify-center rounded-full ${
                                isReported ? "text-zm-orange hover:bg-zm-hover" : "text-zm-muted hover:text-zm-blue-light hover:bg-zm-hover"
                              }`}
                            >
                              {isReported ? <FaFlag size={9} aria-hidden="true" /> : <FaEllipsisH size={10} aria-hidden="true" />}
                            </button>

                            <AnchoredMenu
                              anchorRef={getReportButtonRef(m.id)}
                              open={reportMenuFor === m.id}
                              onClose={() => setReportMenuFor(null)}
                              align="left"
                              className="w-48 bg-zm-card border border-zm-border rounded-xl shadow-2xl py-1.5 z-50 glow-violet"
                            >
                                <p className="px-3.5 pb-1.5 text-[11px] text-zm-muted">Báo cáo vì?</p>
                                {reportReasons.map((reason) => (
                                  <button
                                    key={reason}
                                    type="button"
                                    role="menuitem"
                                    onClick={() => {
                                      reportMessage(activeChatId, m.id, reason);
                                      setReportMenuFor(null);
                                    }}
                                    className="w-full text-left px-3.5 py-1.5 text-xs hover:bg-zm-hover transition-colors"
                                  >
                                    {reason}
                                  </button>
                                ))}
                            </AnchoredMenu>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {(typingUsers[activeChatId] || []).length > 0 && (
                <div className="px-3 py-1 text-[10px] text-zm-muted italic shrink-0">
                  {(typingUsers[activeChatId] || []).length === 1
                    ? `${typingUsers[activeChatId][0].name} đang nhập...`
                    : `${typingUsers[activeChatId][0].name} và ${typingUsers[activeChatId].length - 1} người khác đang nhập...`}
                </div>
              )}

              {pendingImage && (
                <div className="px-2 pt-2 flex items-center gap-2 shrink-0">
                  <div className="relative">
                    <img src={pendingImage} alt="Ảnh sắp gửi" className="w-12 h-12 object-cover rounded-lg border border-zm-border" />
                    <button
                      type="button"
                      onClick={() => setPendingImage(null)}
                      aria-label="Bỏ ảnh đính kèm"
                      className="absolute -top-1.5 -right-1.5 bg-zm-card border border-zm-border rounded-full p-1 text-zm-muted hover:text-zm-heart"
                    >
                      <FaTimes size={8} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              )}

              {pendingFile && (
                <div className="px-2 pt-2 flex items-center gap-2 shrink-0">
                  <div className="relative">
                    {pendingFile.type?.startsWith("video/") ? (
                      <video src={pendingFile.url} className="w-12 h-12 object-cover rounded-lg border border-zm-border" />
                    ) : (
                      <div className="flex items-center gap-1.5 rounded-lg border border-zm-border bg-zm-bg px-2 py-1.5">
                        <p className="text-[11px] font-medium max-w-[100px] truncate">{pendingFile.name}</p>
                        <p className="text-[9px] text-zm-muted shrink-0">{formatFileSize(pendingFile.size)}</p>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => setPendingFile(null)}
                      aria-label="Bỏ tệp đính kèm"
                      className="absolute -top-1.5 -right-1.5 bg-zm-card border border-zm-border rounded-full p-1 text-zm-muted hover:text-zm-heart"
                    >
                      <FaTimes size={8} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              )}

              {replyingTo && (
                <div className="px-2 pt-2 flex items-center gap-1.5 shrink-0">
                  <div className="flex-1 min-w-0 flex items-center gap-1.5 pl-1.5 pr-2 py-1 border-l-2 border-zm-blue-light bg-zm-hover/60 rounded-md">
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-semibold text-zm-blue-light truncate">
                        Trả lời {replyingTo.from === "me" ? "chính mình" : replyingTo.senderName}
                      </p>
                      <p className="text-[10px] text-zm-muted truncate italic">
                        {replyingTo.text ||
                          (replyingTo.image ? "Đã gửi một ảnh" : replyingTo.file ? "Đã gửi một tệp đính kèm" : "")}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setReplyingTo(null)}
                      aria-label="Huỷ trả lời"
                      className="w-11 h-11 flex items-center justify-center text-zm-muted hover:text-zm-heart shrink-0"
                    >
                      <FaTimes size={9} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              )}

              <div className="p-2 border-t border-zm-border shrink-0 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  aria-label="Đính kèm ảnh"
                  className="w-11 h-11 flex items-center justify-center text-zm-blue-light hover:bg-zm-hover rounded-full shrink-0"
                >
                  <FaImage size={15} aria-hidden="true" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  hidden
                  aria-label="Chọn ảnh để đính kèm"
                  onChange={pickImage}
                />
                <button
                  type="button"
                  onClick={() => attachmentInputRef.current?.click()}
                  aria-label="Đính kèm video hoặc tệp"
                  className="w-11 h-11 flex items-center justify-center text-zm-blue-light hover:bg-zm-hover rounded-full shrink-0"
                >
                  <FaPaperclip size={15} aria-hidden="true" />
                </button>
                <input
                  ref={attachmentInputRef}
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime,video/ogg,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar"
                  hidden
                  aria-label="Chọn video hoặc tệp để đính kèm"
                  onChange={pickAttachment}
                />
                <input
                  value={text}
                  onChange={(e) => {
                    setText(e.target.value);
                    if (e.target.value.trim()) sendTyping(activeChatId);
                  }}
                  onKeyDown={(e) => e.key === "Enter" && send()}
                  aria-label="Nhập tin nhắn"
                  placeholder="Nhập tin nhắn..."
                  className="flex-1 min-w-0 bg-zm-bg border border-zm-border rounded-full px-3 py-2 text-sm outline-none placeholder-zm-muted"
                />
                <button
                  type="button"
                  onClick={send}
                  disabled={(!text.trim() && !pendingImage && !pendingFile) || uploadingImage}
                  aria-label="Gửi tin nhắn"
                  className="w-11 h-11 flex items-center justify-center shrink-0 text-zm-blue-light disabled:text-zm-muted"
                >
                  <FaPaperPlane size={15} aria-hidden="true" />
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {lightboxImage && (
        <ImageLightbox
          images={[lightboxImage]}
          index={0}
          onClose={() => setLightboxImage(null)}
          onNavigate={() => {}}
        />
      )}

      {forwardingMessage && (
        <ForwardMessageModal
          conversations={conversations}
          onClose={() => setForwardingMessage(null)}
          onForward={handleForward}
        />
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Tin nhắn${totalUnread > 0 ? ` (${totalUnread} chưa đọc)` : ""}`}
        aria-expanded={open}
        className="relative w-14 h-14 rounded-full bg-gradient-to-br from-zm-blue to-zm-blue-light text-white flex items-center justify-center shadow-2xl glow-violet hover:opacity-90 transition-opacity"
      >
        <FaCommentDots size={22} aria-hidden="true" />
        {totalUnread > 0 && (
          <span
            aria-hidden="true"
            className="absolute -top-1 -right-1 bg-zm-orange text-white text-[11px] font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-[0_0_8px_rgba(236,72,153,0.8)] ring-2 ring-zm-bg"
          >
            {totalUnread}
          </span>
        )}
      </button>
    </div>
  );
}
