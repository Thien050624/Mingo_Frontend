import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FaSearch,
  FaInfoCircle,
  FaSmile,
  FaPaperPlane,
  FaImage,
  FaHeart,
  FaRegHeart,
  FaEllipsisH,
  FaFlag,
  FaTimes,
  FaBellSlash,
  FaBell,
  FaTrash,
  FaCheck,
  FaUsers,
  FaUserFriends,
  FaSignOutAlt,
  FaCrown,
  FaUserPlus,
  FaUndoAlt,
  FaPaperclip,
  FaReply,
  FaShare,
  FaThumbtack,
  FaPen,
  FaArrowLeft,
} from "react-icons/fa";
import { useChat } from "../context/ChatContext";
import { useCurrentUser } from "../context/UserContext";
import { useToast } from "../context/ToastContext";
import { uploadImage, uploadFile } from "../api/uploads";
import { formatFileSize } from "../utils/file";
import { replyPreviewText } from "../api/chat";
import Avatar from "../components/common/Avatar";
import AnchoredMenu from "../components/common/AnchoredMenu";
import { SlowLoadBanner } from "../components/common/LoadingIndicator";
import ImageLightbox from "../components/common/ImageLightbox";
import MessageAttachment from "../components/chat/MessageAttachment";
import ChatSkeleton from "../components/chat/ChatSkeleton";
import NewGroupModal from "../components/chat/NewGroupModal";
import AddMemberModal from "../components/chat/AddMemberModal";
import ForwardMessageModal from "../components/chat/ForwardMessageModal";

const reportReasons = ["Spam", "Nội dung không phù hợp", "Quấy rối / thù ghét", "Khác"];
const emojiList = ["😀", "😂", "😍", "😢", "😮", "😡", "👍", "🙏", "🎉", "❤️", "🔥", "😴"];

export default function Chat() {
  const location = useLocation();
  const { currentUser } = useCurrentUser();
  const { showToast } = useToast();
  const {
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
    createGroup,
  } = useChat();
  const [activeId, setActiveId] = useState(() => location.state?.activeConversationId || null);
  const [text, setText] = useState("");
  const [query, setQuery] = useState("");
  const [pendingImage, setPendingImage] = useState(null);
  const [pendingFile, setPendingFile] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [reportMenuFor, setReportMenuFor] = useState(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [msgSearchOpen, setMsgSearchOpen] = useState(false);
  const [msgSearchQuery, setMsgSearchQuery] = useState("");
  const [msgSearchResults, setMsgSearchResults] = useState([]);
  const [msgSearching, setMsgSearching] = useState(false);
  const [highlightedMessageId, setHighlightedMessageId] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [forwardingMessage, setForwardingMessage] = useState(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [pinnedPanelOpen, setPinnedPanelOpen] = useState(false);
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [pinnedLoading, setPinnedLoading] = useState(false);
  const reportButtonRefs = useRef({});
  const msgSearchRef = useRef(null);
  const emojiRef = useRef(null);
  const fileInputRef = useRef(null);
  const attachmentInputRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const prevScrollHeightRef = useRef(null);

  useEffect(() => {
    if (!loading && !activeId && conversations.length > 0) {
      if (location.state?.activeConversationId) {
        setActiveId(location.state.activeConversationId);
      } else if (window.matchMedia("(min-width: 640px)").matches) {
        // On mobile, leave the conversation list showing first instead of
        // auto-opening a thread — only an explicit navigation intent should open one.
        setActiveId(conversations[0].id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, conversations.length]);

  useEffect(() => {
    if (!activeId) return;
    const conv = conversations.find((c) => c.id === activeId);
    if (conv && !conv.messagesLoaded) loadMessages(activeId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, conversations.length]);

  useEffect(() => {
    const conv = conversations.find((c) => c.id === activeId);
    if (!conv?.messagesLoaded || !messagesContainerRef.current) return;
    if (prevScrollHeightRef.current !== null) {
      const container = messagesContainerRef.current;
      container.scrollTop = container.scrollHeight - prevScrollHeightRef.current;
      prevScrollHeightRef.current = null;
    } else {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, conversations.find((c) => c.id === activeId)?.messages.length]);

  const handleMessagesScroll = () => {
    const container = messagesContainerRef.current;
    const conv = conversations.find((c) => c.id === activeId);
    if (!container || !conv) return;
    if (container.scrollTop < 60 && conv.hasMoreMessages && !conv.loadingOlderMessages) {
      prevScrollHeightRef.current = container.scrollHeight;
      loadOlderMessages(activeId);
    }
  };

  const getReportButtonRef = (id) => {
    if (!reportButtonRefs.current[id]) reportButtonRefs.current[id] = { current: null };
    return reportButtonRefs.current[id];
  };

  useEffect(() => {
    if (!showEmoji) return;
    const onClickOutside = (e) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target)) setShowEmoji(false);
    };
    const onKeyDown = (e) => {
      if (e.key === "Escape") setShowEmoji(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [showEmoji]);

  useEffect(() => {
    if (!msgSearchOpen) return;
    const onClickOutside = (e) => {
      if (msgSearchRef.current && !msgSearchRef.current.contains(e.target)) setMsgSearchOpen(false);
    };
    const onKeyDown = (e) => {
      if (e.key === "Escape") setMsgSearchOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [msgSearchOpen]);

  useEffect(() => {
    if (!pinnedPanelOpen) return;
    const onClickOutside = (e) => {
      if (msgSearchRef.current && !msgSearchRef.current.contains(e.target)) setPinnedPanelOpen(false);
    };
    const onKeyDown = (e) => {
      if (e.key === "Escape") setPinnedPanelOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [pinnedPanelOpen]);

  useEffect(() => {
    if (!pinnedPanelOpen || !activeId) return;
    setPinnedLoading(true);
    loadPinnedMessages(activeId)
      .then((list) => setPinnedMessages(list))
      .catch((err) => console.error("Không thể tải tin nhắn đã ghim:", err))
      .finally(() => setPinnedLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pinnedPanelOpen, activeId]);

  useEffect(() => {
    if (!msgSearchOpen || !msgSearchQuery.trim() || !activeId) {
      setMsgSearchResults([]);
      return;
    }
    setMsgSearching(true);
    const handle = setTimeout(() => {
      searchMessages(activeId, msgSearchQuery)
        .then((results) => setMsgSearchResults(results))
        .catch((err) => console.error("Không thể tìm kiếm tin nhắn:", err))
        .finally(() => setMsgSearching(false));
    }, 300);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [msgSearchQuery, msgSearchOpen, activeId]);

  useEffect(() => {
    if (!highlightedMessageId || !messagesContainerRef.current) return;
    const el = messagesContainerRef.current.querySelector(`[data-message-id="${highlightedMessageId}"]`);
    el?.scrollIntoView({ block: "center" });
    const handle = setTimeout(() => setHighlightedMessageId(null), 2000);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlightedMessageId, conversations.find((c) => c.id === activeId)?.messages.length]);

  const handleJumpToResult = async (messageId) => {
    try {
      await jumpToMessage(activeId, messageId);
      setMsgSearchOpen(false);
      setMsgSearchQuery("");
      setMsgSearchResults([]);
      setHighlightedMessageId(messageId);
    } catch (err) {
      console.error("Không thể chuyển đến tin nhắn:", err);
    }
  };

  const active = conversations.find((c) => c.id === activeId);
  const filteredConversations = conversations.filter((c) =>
    (c.user?.name || "").toLowerCase().includes(query.trim().toLowerCase())
  );

  if (loading) {
    return (
      <>
        <SlowLoadBanner className="mb-3" />
        <ChatSkeleton />
      </>
    );
  }

  const switchConversation = (id) => {
    setActiveId(id);
    setShowInfo(false);
    setConfirmAction(null);
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
    prevScrollHeightRef.current = null;
    markRead(id);
  };

  const backToList = () => {
    setActiveId(null);
    setShowInfo(false);
    setConfirmAction(null);
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

  const confirmDeleteConversation = () => {
    const remaining = conversations.filter((c) => c.id !== activeId);
    deleteConversation(activeId);
    setActiveId(remaining[0]?.id ?? null);
    setShowInfo(false);
    setConfirmAction(null);
  };

  const confirmLeaveGroup = () => {
    const remaining = conversations.filter((c) => c.id !== activeId);
    leaveGroup(activeId);
    setActiveId(remaining[0]?.id ?? null);
    setShowInfo(false);
    setConfirmAction(null);
  };

  const confirmDisbandGroup = () => {
    const remaining = conversations.filter((c) => c.id !== activeId);
    disbandGroup(activeId);
    setActiveId(remaining[0]?.id ?? null);
    setShowInfo(false);
    setConfirmAction(null);
  };

  const send = () => {
    if (!text.trim() && !pendingImage && !pendingFile) return;
    sendMessage(activeId, text, pendingImage, pendingFile, replyingTo);
    setText("");
    setPendingImage(null);
    setPendingFile(null);
    setReplyingTo(null);
  };

  const handleJumpToReply = async (messageId) => {
    const conv = conversations.find((c) => c.id === activeId);
    if (conv?.messages.some((m) => m.id === messageId)) {
      setHighlightedMessageId(messageId);
      return;
    }
    try {
      await jumpToMessage(activeId, messageId);
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
    await togglePinMessage(activeId, messageId);
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
    await editMessage(activeId, editingMessageId, editingText);
    setEditingMessageId(null);
    setEditingText("");
  };

  const handleJumpToPinned = async (messageId) => {
    setPinnedPanelOpen(false);
    const conv = conversations.find((c) => c.id === activeId);
    if (conv?.messages.some((m) => m.id === messageId)) {
      setHighlightedMessageId(messageId);
      return;
    }
    try {
      await jumpToMessage(activeId, messageId);
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

  const handleCreateGroup = async (name, memberIds) => {
    const id = await createGroup(name, memberIds);
    setShowNewGroup(false);
    switchConversation(id);
  };

  const handleAddMembers = async (memberIds) => {
    await addMembers(activeId, memberIds);
    setShowAddMember(false);
  };

  const insertEmoji = (emoji) => {
    setText((prev) => prev + emoji);
    setShowEmoji(false);
  };

  return (
    <div className="w-full h-[calc(100vh-9.5rem)] lg:h-[calc(100vh-5.5rem)] bg-zm-card rounded-2xl border border-zm-border overflow-hidden flex">
      <div className={`w-full sm:w-80 border-r border-zm-border flex-col shrink-0 ${active ? "hidden sm:flex" : "flex"}`}>
        <div className="p-3 border-b border-zm-border">
          <div className="flex items-center justify-between mb-2 px-1">
            <h2 className="font-bold text-lg">Đoạn chat</h2>
            <button
              type="button"
              onClick={() => setShowNewGroup(true)}
              aria-label="Tạo nhóm chat"
              className="w-11 h-11 flex items-center justify-center text-zm-blue-light hover:bg-zm-hover rounded-full"
            >
              <FaUsers size={16} aria-hidden="true" />
            </button>
          </div>
          <div className="flex items-center bg-zm-bg rounded-full px-3 h-9">
            <FaSearch className="text-zm-muted text-xs shrink-0" aria-hidden="true" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Tìm kiếm cuộc trò chuyện"
              placeholder="Tìm kiếm cuộc trò chuyện"
              className="bg-transparent outline-none px-2 text-sm flex-1 placeholder-zm-muted"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <FaSearch className="mx-auto text-zm-muted mb-3" size={22} aria-hidden="true" />
              <p className="text-sm font-semibold mb-1">Không tìm thấy hội thoại nào</p>
              <p className="text-xs text-zm-muted">Không có ai tên "{query}" trong đoạn chat của bạn.</p>
            </div>
          ) : (
            filteredConversations.map((c) => (
            <div
              key={c.id}
              className={`flex items-center gap-3 px-3 py-2.5 transition-colors ${
                activeId === c.id ? "bg-zm-hover" : "hover:bg-zm-hover"
              }`}
            >
              {c.group ? (
                <div className="relative shrink-0">
                  {c.user.avatar ? (
                    <Avatar src={c.user.avatar} alt={`Ảnh nhóm ${c.user.name}`} className="w-12 h-12" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-zm-blue/20 text-zm-blue-light flex items-center justify-center">
                      <FaUserFriends size={18} aria-hidden="true" />
                    </div>
                  )}
                </div>
              ) : (
                <Link to={`/profile/${c.user.id}`} className="relative shrink-0">
                  <Avatar src={c.user.avatar} alt={`Ảnh đại diện của ${c.user.name}`} className="w-12 h-12" />
                  {c.online && (
                    <span aria-hidden="true" className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 ring-2 ring-zm-card" />
                  )}
                </Link>
              )}
              <button
                type="button"
                onClick={() => switchConversation(c.id)}
                aria-current={activeId === c.id}
                aria-label={`Cuộc trò chuyện với ${c.user.name}${c.unread > 0 ? `, ${c.unread} tin nhắn chưa đọc` : ""}`}
                className="flex-1 min-w-0 flex items-center gap-3 text-left"
              >
                <div className="min-w-0 flex-1">
                  <p className={`text-sm truncate flex items-center gap-1.5 ${c.unread ? "font-bold" : "font-medium"}`}>
                    {c.user.name}
                    {c.muted && <FaBellSlash className="text-zm-muted shrink-0" size={10} aria-label="Đã tắt thông báo" />}
                  </p>
                  <p className={`text-xs truncate ${c.unread ? "text-zm-text font-semibold" : "text-zm-muted"}`}>
                    {c.lastMessage} · {c.time}
                  </p>
                </div>
                {c.unread > 0 && (
                  <span aria-hidden="true" className="bg-gradient-to-br from-zm-blue to-zm-blue-light text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shrink-0">
                    {c.unread}
                  </span>
                )}
              </button>
            </div>
            ))
          )}
        </div>
      </div>

      {!active ? (
        <div className="hidden sm:flex flex-1 flex-col items-center justify-center text-center p-6">
          <FaTrash className="text-zm-muted mb-3" size={26} aria-hidden="true" />
          <p className="font-semibold mb-1">Không còn cuộc trò chuyện nào</p>
          <p className="text-sm text-zm-muted">Bạn đã xoá hết các cuộc trò chuyện.</p>
        </div>
      ) : (
      <div className="flex flex-1 flex-col min-w-0 relative" ref={msgSearchRef}>
        <div className="flex items-center gap-3 px-4 h-16 border-b border-zm-border shrink-0">
          <button
            type="button"
            onClick={backToList}
            aria-label="Quay lại danh sách hội thoại"
            className="sm:hidden w-11 h-11 flex items-center justify-center -ml-1.5 rounded-full hover:bg-zm-hover text-zm-muted shrink-0"
          >
            <FaArrowLeft size={16} aria-hidden="true" />
          </button>
          {active.group ? (
            <>
              {active.user.avatar ? (
                <Avatar src={active.user.avatar} alt={`Ảnh nhóm ${active.user.name}`} className="w-10 h-10" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-zm-blue/20 text-zm-blue-light flex items-center justify-center shrink-0">
                  <FaUserFriends size={16} aria-hidden="true" />
                </div>
              )}
              <div>
                <p className="font-semibold text-sm">{active.user.name}</p>
                <p className="text-xs text-zm-muted">{active.participants.length} thành viên</p>
              </div>
            </>
          ) : (
            <>
              <Link to={`/profile/${active.user.id}`} className="relative shrink-0">
                <Avatar src={active.user.avatar} alt={`Ảnh đại diện của ${active.user.name}`} className="w-10 h-10" />
              </Link>
              <div>
                <Link to={`/profile/${active.user.id}`} className="font-semibold text-sm hover:text-zm-blue-light">
                  {active.user.name}
                </Link>
                <p className="text-xs text-zm-muted">Nhắn tin trực tiếp</p>
              </div>
            </>
          )}
          <div className="ml-auto flex items-center gap-1 text-zm-blue-light">
            <button
              type="button"
              onClick={() => setMsgSearchOpen((v) => !v)}
              aria-label="Tìm kiếm tin nhắn"
              aria-expanded={msgSearchOpen}
              className={`w-11 h-11 flex items-center justify-center rounded-full hover:bg-zm-hover ${msgSearchOpen ? "bg-zm-hover" : ""}`}
            >
              <FaSearch size={15} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setPinnedPanelOpen((v) => !v)}
              aria-label="Tin nhắn đã ghim"
              aria-expanded={pinnedPanelOpen}
              className={`w-11 h-11 flex items-center justify-center rounded-full hover:bg-zm-hover ${pinnedPanelOpen ? "bg-zm-hover" : ""}`}
            >
              <FaThumbtack size={14} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setShowInfo((v) => !v)}
              aria-label="Thông tin cuộc trò chuyện"
              aria-expanded={showInfo}
              className={`w-11 h-11 flex items-center justify-center rounded-full hover:bg-zm-hover ${showInfo ? "bg-zm-hover" : ""}`}
            >
              <FaInfoCircle size={16} aria-hidden="true" />
            </button>
          </div>
        </div>

        {msgSearchOpen && (
          <div className="absolute top-16 left-0 right-0 z-20 bg-zm-card border-b border-zm-border shadow-2xl max-h-96 flex flex-col glow-violet">
            <div className="p-2.5 border-b border-zm-border flex items-center gap-2 shrink-0">
              <FaSearch className="text-zm-muted text-xs shrink-0 ml-1" aria-hidden="true" />
              <input
                autoFocus
                value={msgSearchQuery}
                onChange={(e) => setMsgSearchQuery(e.target.value)}
                aria-label="Nhập từ khoá tìm kiếm tin nhắn"
                placeholder="Tìm kiếm tin nhắn trong đoạn chat..."
                className="flex-1 min-w-0 bg-transparent outline-none text-sm placeholder-zm-muted"
              />
              <button
                type="button"
                onClick={() => setMsgSearchOpen(false)}
                aria-label="Đóng tìm kiếm"
                className="w-11 h-11 flex items-center justify-center text-zm-muted hover:text-zm-heart"
              >
                <FaTimes size={13} aria-hidden="true" />
              </button>
            </div>
            <div className="overflow-y-auto">
              {msgSearching && <p className="text-xs text-zm-muted text-center py-4">Đang tìm kiếm...</p>}
              {!msgSearching && msgSearchQuery.trim() && msgSearchResults.length === 0 && (
                <p className="text-xs text-zm-muted text-center py-4">Không tìm thấy tin nhắn nào phù hợp.</p>
              )}
              {!msgSearching &&
                msgSearchResults.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleJumpToResult(m.id)}
                    className="w-full text-left px-3.5 py-2.5 hover:bg-zm-hover transition-colors flex items-start gap-2.5 border-b border-zm-border last:border-b-0"
                  >
                    <Avatar src={m.senderAvatar} alt="" className="w-8 h-8 shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <p className="text-xs font-semibold truncate">{m.senderName}</p>
                        <p className="text-[10px] text-zm-muted shrink-0">
                          {new Date(m.createdAt).toLocaleDateString("vi-VN")} {m.time}
                        </p>
                      </div>
                      <p className="text-xs text-zm-muted truncate">{m.text}</p>
                    </div>
                  </button>
                ))}
            </div>
          </div>
        )}

        {pinnedPanelOpen && (
          <div className="absolute top-16 left-0 right-0 z-20 bg-zm-card border-b border-zm-border shadow-2xl max-h-96 flex flex-col glow-violet">
            <div className="p-2.5 border-b border-zm-border flex items-center justify-between shrink-0">
              <p className="text-sm font-semibold px-1.5 flex items-center gap-1.5">
                <FaThumbtack size={12} aria-hidden="true" /> Tin nhắn đã ghim
              </p>
              <button
                type="button"
                onClick={() => setPinnedPanelOpen(false)}
                aria-label="Đóng danh sách ghim"
                className="w-11 h-11 flex items-center justify-center text-zm-muted hover:text-zm-heart"
              >
                <FaTimes size={13} aria-hidden="true" />
              </button>
            </div>
            <div className="overflow-y-auto">
              {pinnedLoading && <p className="text-xs text-zm-muted text-center py-4">Đang tải...</p>}
              {!pinnedLoading && pinnedMessages.length === 0 && (
                <p className="text-xs text-zm-muted text-center py-4">Chưa có tin nhắn nào được ghim.</p>
              )}
              {!pinnedLoading &&
                pinnedMessages.map((m) => (
                  <div
                    key={m.id}
                    className="group flex items-start gap-2.5 px-3.5 py-2.5 hover:bg-zm-hover transition-colors border-b border-zm-border last:border-b-0"
                  >
                    <button type="button" onClick={() => handleJumpToPinned(m.id)} className="flex items-start gap-2.5 flex-1 min-w-0 text-left">
                      <Avatar src={m.senderAvatar} alt="" className="w-8 h-8 shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-2">
                          <p className="text-xs font-semibold truncate">{m.senderName}</p>
                          <p className="text-[10px] text-zm-muted shrink-0">{m.time}</p>
                        </div>
                        <p className="text-xs text-zm-muted truncate">
                          {m.text || (m.image ? "Đã gửi một ảnh" : m.file ? "Đã gửi một tệp đính kèm" : "")}
                        </p>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTogglePin(m.id)}
                      aria-label="Bỏ ghim tin nhắn"
                      className="w-11 h-11 flex items-center justify-center rounded-full text-zm-blue-light hover:bg-zm-hover shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                    >
                      <FaThumbtack size={12} aria-hidden="true" />
                    </button>
                  </div>
                ))}
            </div>
          </div>
        )}

        <div className="flex-1 flex min-h-0">
          <div className="flex-1 flex flex-col min-w-0">
            <div
              ref={messagesContainerRef}
              onScroll={handleMessagesScroll}
              className="flex-1 overflow-y-auto p-4 flex flex-col gap-2 bg-zm-bg/40"
            >
              {active.loadingOlderMessages && (
                <div className="text-center text-xs text-zm-muted py-1">Đang tải tin nhắn cũ hơn...</div>
              )}
              {active.messages.map((m, i) => {
                if (m.system) {
                  return (
                    <div key={m.id} className="text-center text-xs text-zm-muted py-1">
                      {m.systemText}
                    </div>
                  );
                }
                const isFirstInGroup = i === 0 || active.messages[i - 1].senderId !== m.senderId;
                const isLastInGroup =
                  i === active.messages.length - 1 || active.messages[i + 1].senderId !== m.senderId;
                const showAvatar = m.from === "them" && isLastInGroup;
                const isReported = m.reportedByMe;
                if (m.recalled) {
                  return (
                    <div
                      key={m.id}
                      data-message-id={m.id}
                      className={`flex items-end gap-1.5 max-w-[70%] rounded-2xl transition-colors duration-1000 ${
                        m.from === "me" ? "self-end flex-row-reverse" : "self-start"
                      } ${highlightedMessageId === m.id ? "bg-zm-blue/20" : ""}`}
                    >
                      {m.from === "them" && (
                        <div className={`shrink-0 ${showAvatar ? "" : "invisible"}`}>
                          <Avatar src={m.senderAvatar} alt="" className="w-6 h-6" />
                        </div>
                      )}
                      <div className="px-3.5 py-2 rounded-2xl text-sm italic text-zm-muted border border-zm-border">
                        Tin nhắn đã được thu hồi
                      </div>
                    </div>
                  );
                }
                return (
                  <div
                    key={m.id}
                    data-message-id={m.id}
                    className={`group flex items-end gap-1.5 max-w-[70%] rounded-2xl transition-colors duration-1000 ${
                      m.from === "me" ? "self-end flex-row-reverse" : "self-start"
                    } ${highlightedMessageId === m.id ? "bg-zm-blue/20" : ""}`}
                  >
                    {m.from === "them" && (
                      <Link
                        to={`/profile/${m.senderId}`}
                        className={`shrink-0 ${showAvatar ? "" : "invisible"}`}
                        tabIndex={showAvatar ? 0 : -1}
                      >
                        <Avatar src={m.senderAvatar} alt="" className="w-6 h-6" />
                      </Link>
                    )}

                    <div>
                      {active.group && m.from === "them" && isFirstInGroup && (
                        <p className="text-[11px] text-zm-muted px-1 mb-0.5">{m.senderName}</p>
                      )}
                      {m.forwarded && (
                        <p className="flex items-center gap-1 text-[10px] text-zm-muted italic px-1 mb-0.5">
                          <FaShare size={9} aria-hidden="true" /> Tin nhắn đã chuyển tiếp
                        </p>
                      )}
                      {m.pinned && (
                        <p className="flex items-center gap-1 text-[10px] text-zm-blue-light italic px-1 mb-0.5">
                          <FaThumbtack size={9} aria-hidden="true" /> Đã ghim
                        </p>
                      )}
                      {m.replyTo && (
                        <button
                          type="button"
                          onClick={() => handleJumpToReply(m.replyTo.id)}
                          className="block w-full text-left mb-1 pl-2 pr-2.5 py-1 border-l-2 border-zm-blue-light bg-zm-hover/60 hover:bg-zm-hover rounded-md transition-colors"
                        >
                          <p className="text-[11px] font-semibold text-zm-blue-light truncate">{m.replyTo.senderName}</p>
                          <p className="text-[11px] text-zm-muted truncate italic">{replyPreviewText(m.replyTo)}</p>
                        </button>
                      )}
                      {m.image && (
                        <img
                          src={m.image}
                          alt="Ảnh đính kèm trong tin nhắn"
                          onClick={() => setLightboxImage(m.image)}
                          className="max-w-[220px] rounded-2xl border border-zm-border mb-1 cursor-pointer"
                        />
                      )}
                      {m.file && <MessageAttachment file={m.file} />}
                      {editingMessageId === m.id ? (
                        <div className="flex items-center gap-1.5 min-w-[200px]">
                          <input
                            autoFocus
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveEditing();
                              if (e.key === "Escape") cancelEditing();
                            }}
                            aria-label="Chỉnh sửa nội dung tin nhắn"
                            className="flex-1 min-w-0 bg-zm-bg border border-zm-blue-light rounded-2xl px-3 py-1.5 text-sm outline-none"
                          />
                          <button
                            type="button"
                            onClick={saveEditing}
                            aria-label="Lưu chỉnh sửa"
                            className="w-11 h-11 flex items-center justify-center text-zm-blue-light hover:bg-zm-hover rounded-full shrink-0"
                          >
                            <FaCheck size={12} aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={cancelEditing}
                            aria-label="Huỷ chỉnh sửa"
                            className="w-11 h-11 flex items-center justify-center text-zm-muted hover:text-zm-heart rounded-full shrink-0"
                          >
                            <FaTimes size={12} aria-hidden="true" />
                          </button>
                        </div>
                      ) : (
                        m.text && (
                          <div
                            className={`px-3.5 py-2 rounded-2xl text-sm ${
                              m.from === "me" ? "bg-zm-blue text-white" : "bg-zm-card border border-zm-border"
                            }`}
                          >
                            {m.text}
                            {m.edited && (
                              <span className={`text-[10px] italic ml-1.5 ${m.from === "me" ? "text-white/70" : "text-zm-muted"}`}>
                                (đã chỉnh sửa)
                              </span>
                            )}
                          </div>
                        )
                      )}
                      {m.likedBy?.length > 0 && (
                        <div
                          className={`flex items-center gap-1 ${m.from === "me" ? "justify-end" : "justify-start"} mt-0.5 px-1`}
                          aria-label={`${m.likedBy.map((p) => p.name).join(", ")} đã thả tim tin nhắn này`}
                        >
                          <FaHeart className="text-zm-heart" size={11} aria-hidden="true" />
                          {m.likedBy.length > 1 && (
                            <span className="text-[10px] text-zm-muted">{m.likedBy.length}</span>
                          )}
                        </div>
                      )}
                      <div className={`text-[10px] text-zm-muted mt-0.5 px-1 ${m.from === "me" ? "text-right" : "text-left"}`}>
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
                            <div className="text-[10px] text-zm-muted text-right px-1">
                              {active.group ? `${seenBy} người đã xem` : "Đã xem"}
                            </div>
                          );
                        })()}
                    </div>

                    <div className="relative flex items-center gap-0.5 shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => setReplyingTo(m)}
                        aria-label="Trả lời tin nhắn"
                        className="w-11 h-11 flex items-center justify-center rounded-full text-zm-muted hover:text-zm-blue-light hover:bg-zm-hover"
                      >
                        <FaReply size={12} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setForwardingMessage(m)}
                        aria-label="Chuyển tiếp tin nhắn"
                        className="w-11 h-11 flex items-center justify-center rounded-full text-zm-muted hover:text-zm-blue-light hover:bg-zm-hover"
                      >
                        <FaShare size={12} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => togglePinMessage(activeId, m.id)}
                        aria-label={m.pinned ? "Bỏ ghim tin nhắn" : "Ghim tin nhắn"}
                        className={`w-11 h-11 flex items-center justify-center rounded-full hover:bg-zm-hover ${
                          m.pinned ? "text-zm-blue-light" : "text-zm-muted hover:text-zm-blue-light"
                        }`}
                      >
                        <FaThumbtack size={12} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleLikeMessage(activeId, m.id)}
                        aria-label={m.liked ? "Bỏ thả tim tin nhắn" : "Thả tim tin nhắn"}
                        className="w-11 h-11 flex items-center justify-center rounded-full text-zm-muted hover:text-zm-heart hover:bg-zm-hover"
                      >
                        {m.liked ? <FaHeart className="text-zm-heart" size={12} aria-hidden="true" /> : <FaRegHeart size={12} aria-hidden="true" />}
                      </button>

                      {m.from === "me" && m.text && (
                        <button
                          type="button"
                          onClick={() => startEditing(m)}
                          aria-label="Chỉnh sửa tin nhắn"
                          className="w-11 h-11 flex items-center justify-center rounded-full text-zm-muted hover:text-zm-blue-light hover:bg-zm-hover"
                        >
                          <FaPen size={11} aria-hidden="true" />
                        </button>
                      )}

                      {m.from === "me" && (
                        <button
                          type="button"
                          onClick={() => recallMessage(activeId, m.id)}
                          aria-label="Thu hồi tin nhắn"
                          className="w-11 h-11 flex items-center justify-center rounded-full text-zm-muted hover:text-zm-heart hover:bg-zm-hover"
                        >
                          <FaUndoAlt size={11} aria-hidden="true" />
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
                                ? unreportMessage(activeId, m.id)
                                : setReportMenuFor(reportMenuFor === m.id ? null : m.id)
                            }
                            aria-label={isReported ? "Gỡ báo cáo tin nhắn này" : "Báo cáo tin nhắn"}
                            aria-haspopup={isReported ? undefined : "true"}
                            className={`w-11 h-11 flex items-center justify-center rounded-full ${
                              isReported ? "text-zm-orange hover:bg-zm-hover" : "text-zm-muted hover:text-zm-blue-light hover:bg-zm-hover"
                            }`}
                          >
                            {isReported ? <FaFlag size={11} aria-hidden="true" /> : <FaEllipsisH size={12} aria-hidden="true" />}
                          </button>

                          <AnchoredMenu
                            anchorRef={getReportButtonRef(m.id)}
                            open={reportMenuFor === m.id}
                            onClose={() => setReportMenuFor(null)}
                            align="left"
                            className="w-52 bg-zm-card border border-zm-border rounded-xl shadow-2xl py-1.5 z-50 glow-violet"
                          >
                            <p className="px-4 pb-1.5 text-xs text-zm-muted">Báo cáo tin nhắn này vì?</p>
                            {reportReasons.map((reason) => (
                              <button
                                key={reason}
                                type="button"
                                role="menuitem"
                                onClick={() => {
                                  reportMessage(activeId, m.id, reason);
                                  setReportMenuFor(null);
                                }}
                                className="w-full text-left px-4 py-2 text-sm hover:bg-zm-hover transition-colors"
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

            {(typingUsers[activeId] || []).length > 0 && (
              <div className="px-4 py-1 text-xs text-zm-muted italic shrink-0">
                {(typingUsers[activeId] || []).length === 1
                  ? `${typingUsers[activeId][0].name} đang nhập...`
                  : `${typingUsers[activeId][0].name} và ${typingUsers[activeId].length - 1} người khác đang nhập...`}
              </div>
            )}

            {pendingImage && (
              <div className="px-3 pt-2 flex items-center gap-2 shrink-0">
                <div className="relative">
                  <img src={pendingImage} alt="Ảnh sắp gửi" className="w-16 h-16 object-cover rounded-lg border border-zm-border" />
                  <button
                    type="button"
                    onClick={() => setPendingImage(null)}
                    aria-label="Bỏ ảnh đính kèm"
                    className="absolute -top-1.5 -right-1.5 bg-zm-card border border-zm-border rounded-full p-1 text-zm-muted hover:text-zm-heart"
                  >
                    <FaTimes size={9} aria-hidden="true" />
                  </button>
                </div>
              </div>
            )}

            {pendingFile && (
              <div className="px-3 pt-2 flex items-center gap-2 shrink-0">
                <div className="relative">
                  {pendingFile.type?.startsWith("video/") ? (
                    <video src={pendingFile.url} className="w-16 h-16 object-cover rounded-lg border border-zm-border" />
                  ) : (
                    <div className="flex items-center gap-2 rounded-lg border border-zm-border bg-zm-bg px-3 py-2">
                      <p className="text-xs font-medium max-w-[160px] truncate">{pendingFile.name}</p>
                      <p className="text-[10px] text-zm-muted shrink-0">{formatFileSize(pendingFile.size)}</p>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setPendingFile(null)}
                    aria-label="Bỏ tệp đính kèm"
                    className="absolute -top-1.5 -right-1.5 bg-zm-card border border-zm-border rounded-full p-1 text-zm-muted hover:text-zm-heart"
                  >
                    <FaTimes size={9} aria-hidden="true" />
                  </button>
                </div>
              </div>
            )}

            {replyingTo && (
              <div className="px-3 pt-2 flex items-center gap-2 shrink-0">
                <div className="flex-1 min-w-0 flex items-center gap-2 pl-2 pr-2.5 py-1.5 border-l-2 border-zm-blue-light bg-zm-hover/60 rounded-md">
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold text-zm-blue-light truncate">
                      Trả lời {replyingTo.from === "me" ? "chính mình" : replyingTo.senderName}
                    </p>
                    <p className="text-[11px] text-zm-muted truncate italic">
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
                    <FaTimes size={11} aria-hidden="true" />
                  </button>
                </div>
              </div>
            )}

            <div className="p-3 border-t border-zm-border flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Đính kèm ảnh"
                className="w-11 h-11 flex items-center justify-center shrink-0 text-zm-blue-light hover:bg-zm-hover rounded-full"
              >
                <FaImage size={18} aria-hidden="true" />
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
                className="w-11 h-11 flex items-center justify-center shrink-0 text-zm-blue-light hover:bg-zm-hover rounded-full"
              >
                <FaPaperclip size={18} aria-hidden="true" />
              </button>
              <input
                ref={attachmentInputRef}
                type="file"
                accept="video/mp4,video/webm,video/quicktime,video/ogg,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar"
                hidden
                aria-label="Chọn video hoặc tệp để đính kèm"
                onChange={pickAttachment}
              />
              <div className="flex-1 min-w-0 flex items-center bg-zm-bg border border-zm-border rounded-full px-3">
                <input
                  value={text}
                  onChange={(e) => {
                    setText(e.target.value);
                    if (e.target.value.trim()) sendTyping(activeId);
                  }}
                  onKeyDown={(e) => e.key === "Enter" && send()}
                  aria-label="Nhập tin nhắn"
                  placeholder="Nhập tin nhắn..."
                  className="flex-1 min-w-0 bg-transparent outline-none text-sm py-2.5 placeholder-zm-muted"
                />
                <div ref={emojiRef} className="relative">
                  {showEmoji && (
                    <div
                      role="menu"
                      className="absolute bottom-full right-0 mb-2 bg-zm-card border border-zm-border rounded-xl shadow-2xl p-2 grid grid-cols-6 gap-1 w-64 z-10 glow-violet"
                    >
                      {emojiList.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => insertEmoji(emoji)}
                          aria-label={`Chèn biểu tượng ${emoji}`}
                          className="text-xl hover:scale-125 transition-transform"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowEmoji((v) => !v)}
                    aria-label="Chèn biểu tượng cảm xúc"
                    aria-expanded={showEmoji}
                    className="w-11 h-11 flex items-center justify-center shrink-0 text-zm-muted hover:text-yellow-400"
                  >
                    <FaSmile size={16} aria-hidden="true" />
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={send}
                disabled={(!text.trim() && !pendingImage && !pendingFile) || uploadingImage}
                aria-label="Gửi tin nhắn"
                className="w-11 h-11 flex items-center justify-center shrink-0 text-zm-blue-light hover:bg-zm-hover disabled:text-zm-muted rounded-full"
              >
                <FaPaperPlane size={17} aria-hidden="true" />
              </button>
            </div>
          </div>

          {showInfo && (
            <div className="fixed inset-0 z-50 bg-zm-card sm:static sm:z-auto sm:inset-auto sm:w-64 sm:border-l sm:border-zm-border sm:shrink-0 overflow-y-auto p-4 flex flex-col items-center text-center gap-3">
              <button
                type="button"
                onClick={() => setShowInfo(false)}
                aria-label="Đóng thông tin cuộc trò chuyện"
                className="sm:hidden self-start -ml-1 -mt-1 w-11 h-11 flex items-center justify-center rounded-full hover:bg-zm-hover text-zm-muted"
              >
                <FaArrowLeft size={16} aria-hidden="true" />
              </button>
              {active.user.avatar ? (
                <Avatar src={active.user.avatar} alt="" className="w-20 h-20 ring-2 ring-zm-blue/40" />
              ) : active.group ? (
                <div className="w-20 h-20 rounded-full bg-zm-blue/20 text-zm-blue-light flex items-center justify-center ring-2 ring-zm-blue/40">
                  <FaUserFriends size={26} aria-hidden="true" />
                </div>
              ) : null}
              <div>
                <p className="font-semibold">{active.user.name}</p>
                <p className="text-xs text-zm-muted mt-0.5">
                  {active.group ? `${active.participants.length} thành viên` : "Nhắn tin trực tiếp"}
                </p>
              </div>
              {!active.group && (
                <Link
                  to={`/profile/${active.user.id}`}
                  className="w-full text-sm font-semibold text-center bg-zm-bg hover:bg-zm-hover border border-zm-border rounded-lg py-2 transition-colors"
                >
                  Xem trang cá nhân
                </Link>
              )}
              {active.group && (
                <div className="w-full text-left bg-zm-bg border border-zm-border rounded-lg py-2 px-2.5">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[11px] font-semibold text-zm-muted">Thành viên</p>
                    <button
                      type="button"
                      onClick={() => setShowAddMember(true)}
                      aria-label="Thêm thành viên"
                      className="w-11 h-11 flex items-center justify-center text-zm-blue-light hover:bg-zm-hover rounded-full"
                    >
                      <FaUserPlus size={12} aria-hidden="true" />
                    </button>
                  </div>
                  {active.participants.map((p) => (
                    <div key={p.id} className="flex items-center gap-2 py-1 group/member">
                      <Link
                        to={`/profile/${p.id}`}
                        className="flex items-center gap-2 text-sm hover:text-zm-blue-light min-w-0 flex-1"
                      >
                        <Avatar src={p.avatar} alt="" className="w-6 h-6" />
                        <span className="truncate">{p.name}</span>
                        {p.id === active.createdBy && (
                          <FaCrown
                            className="text-yellow-500 shrink-0"
                            size={11}
                            aria-label="Trưởng nhóm"
                            title="Trưởng nhóm"
                          />
                        )}
                      </Link>
                      {active.isLeader && p.id !== currentUser.id && (
                        <button
                          type="button"
                          onClick={() => removeMember(activeId, p.id)}
                          aria-label={`Xoá ${p.name} khỏi nhóm`}
                          className="shrink-0 w-11 h-11 flex items-center justify-center text-zm-muted hover:text-zm-heart hover:bg-zm-hover rounded-full opacity-100 sm:opacity-0 sm:group-hover/member:opacity-100 transition-opacity"
                        >
                          <FaTimes size={10} aria-hidden="true" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <div className="w-full flex flex-col gap-1 mt-2">
                <button
                  type="button"
                  onClick={() => toggleMute(activeId)}
                  className="w-full flex items-center gap-2.5 text-sm px-2 py-2 rounded-lg hover:bg-zm-hover text-left transition-colors"
                >
                  {active.muted ? (
                    <FaBell size={13} className="text-zm-muted" aria-hidden="true" />
                  ) : (
                    <FaBellSlash size={13} className="text-zm-muted" aria-hidden="true" />
                  )}
                  {active.muted ? "Bật lại thông báo" : "Tắt thông báo"}
                </button>

                {confirmAction === null && (
                  <button
                    type="button"
                    onClick={() => setConfirmAction("delete")}
                    className="w-full flex items-center gap-2.5 text-sm px-2 py-2 rounded-lg hover:bg-zm-hover text-left text-zm-heart transition-colors"
                  >
                    <FaTrash size={13} aria-hidden="true" /> Xoá cuộc trò chuyện
                  </button>
                )}

                {confirmAction === "delete" && (
                  <div className="w-full bg-zm-bg border border-zm-border rounded-lg p-2.5 mt-1">
                    <p className="text-xs text-zm-muted mb-2">Xoá toàn bộ đoạn chat này?</p>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={confirmDeleteConversation}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-zm-heart/15 hover:bg-zm-heart/25 text-zm-heart text-xs font-semibold rounded-lg py-1.5"
                      >
                        <FaCheck size={10} aria-hidden="true" /> Xoá
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmAction(null)}
                        className="flex-1 text-xs font-semibold rounded-lg py-1.5 text-zm-muted hover:bg-zm-hover"
                      >
                        Huỷ
                      </button>
                    </div>
                  </div>
                )}

                {active.group && confirmAction === null && (
                  <button
                    type="button"
                    onClick={() => setConfirmAction("leave")}
                    className="w-full flex items-center gap-2.5 text-sm px-2 py-2 rounded-lg hover:bg-zm-hover text-left text-zm-heart transition-colors"
                  >
                    <FaSignOutAlt size={13} aria-hidden="true" /> Rời nhóm
                  </button>
                )}

                {active.group && confirmAction === "leave" && (
                  <div className="w-full bg-zm-bg border border-zm-border rounded-lg p-2.5 mt-1">
                    <p className="text-xs text-zm-muted mb-2">Rời khỏi nhóm này? Bạn sẽ không nhận tin nhắn mới nữa.</p>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={confirmLeaveGroup}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-zm-heart/15 hover:bg-zm-heart/25 text-zm-heart text-xs font-semibold rounded-lg py-1.5"
                      >
                        <FaCheck size={10} aria-hidden="true" /> Rời nhóm
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmAction(null)}
                        className="flex-1 text-xs font-semibold rounded-lg py-1.5 text-zm-muted hover:bg-zm-hover"
                      >
                        Huỷ
                      </button>
                    </div>
                  </div>
                )}

                {active.group && active.isLeader && confirmAction === null && (
                  <button
                    type="button"
                    onClick={() => setConfirmAction("disband")}
                    className="w-full flex items-center gap-2.5 text-sm px-2 py-2 rounded-lg hover:bg-zm-hover text-left text-zm-heart transition-colors"
                  >
                    <FaUsers size={13} aria-hidden="true" /> Giải tán nhóm
                  </button>
                )}

                {active.group && active.isLeader && confirmAction === "disband" && (
                  <div className="w-full bg-zm-bg border border-zm-border rounded-lg p-2.5 mt-1">
                    <p className="text-xs text-zm-muted mb-2">
                      Giải tán nhóm này? Toàn bộ tin nhắn sẽ bị xoá và mọi thành viên sẽ không thể truy cập nhóm nữa.
                    </p>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={confirmDisbandGroup}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-zm-heart/15 hover:bg-zm-heart/25 text-zm-heart text-xs font-semibold rounded-lg py-1.5"
                      >
                        <FaCheck size={10} aria-hidden="true" /> Giải tán
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmAction(null)}
                        className="flex-1 text-xs font-semibold rounded-lg py-1.5 text-zm-muted hover:bg-zm-hover"
                      >
                        Huỷ
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      )}

      {showNewGroup && (
        <NewGroupModal onClose={() => setShowNewGroup(false)} onCreate={handleCreateGroup} />
      )}

      {showAddMember && active && (
        <AddMemberModal
          existingMemberIds={active.participants.map((p) => p.id)}
          onClose={() => setShowAddMember(false)}
          onAdd={handleAddMembers}
        />
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
    </div>
  );
}
