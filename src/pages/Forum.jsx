import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaComments,
  FaPaperPlane,
  FaFlag,
  FaEllipsisH,
  FaImage,
  FaPaperclip,
  FaTimes,
  FaHeart,
  FaRegHeart,
  FaUndoAlt,
  FaSearch,
} from "react-icons/fa";
import { useForum } from "../context/ForumContext";
import { useCurrentUser } from "../context/UserContext";
import { uploadImage, uploadFile } from "../api/uploads";
import { formatFileSize } from "../utils/file";
import Avatar from "../components/common/Avatar";
import AnchoredMenu from "../components/common/AnchoredMenu";
import ImageLightbox from "../components/common/ImageLightbox";
import MessageAttachment from "../components/chat/MessageAttachment";
import ForumRoomSkeleton from "../components/forum/ForumRoomSkeleton";

const reportReasons = ["Spam", "Nội dung không phù hợp", "Quấy rối / thù ghét", "Khác"];

export default function Forum() {
  const { currentUser } = useCurrentUser();
  const {
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
  } = useForum();
  const [text, setText] = useState("");
  const [pendingImage, setPendingImage] = useState(null);
  const [pendingFile, setPendingFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [reportMenuFor, setReportMenuFor] = useState(null);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [msgSearchOpen, setMsgSearchOpen] = useState(false);
  const [msgSearchQuery, setMsgSearchQuery] = useState("");
  const [msgSearchResults, setMsgSearchResults] = useState([]);
  const [msgSearching, setMsgSearching] = useState(false);
  const [highlightedMessageId, setHighlightedMessageId] = useState(null);
  const scrollRef = useRef(null);
  const reportButtonRefs = useRef({});
  const msgSearchRef = useRef(null);
  const prevScrollHeightRef = useRef(null);
  const fileInputRef = useRef(null);
  const attachmentInputRef = useRef(null);

  const getReportButtonRef = (id) => {
    if (!reportButtonRefs.current[id]) reportButtonRefs.current[id] = { current: null };
    return reportButtonRefs.current[id];
  };

  useEffect(() => {
    if (loading || !scrollRef.current) return;
    const container = scrollRef.current;
    if (prevScrollHeightRef.current !== null) {
      container.scrollTop = container.scrollHeight - prevScrollHeightRef.current;
      prevScrollHeightRef.current = null;
    } else {
      container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
    }
  }, [messages, loading]);

  const handleScroll = () => {
    const container = scrollRef.current;
    if (!container || !hasMore || loadingOlder) return;
    if (container.scrollTop < 60) {
      prevScrollHeightRef.current = container.scrollHeight;
      loadOlderMessages();
    }
  };

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
    if (!msgSearchOpen || !msgSearchQuery.trim()) {
      setMsgSearchResults([]);
      return;
    }
    setMsgSearching(true);
    const handle = setTimeout(() => {
      searchMessages(msgSearchQuery)
        .then((results) => setMsgSearchResults(results))
        .catch((err) => console.error("Không thể tìm kiếm tin nhắn:", err))
        .finally(() => setMsgSearching(false));
    }, 300);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [msgSearchQuery, msgSearchOpen]);

  useEffect(() => {
    if (!highlightedMessageId || !scrollRef.current) return;
    const el = scrollRef.current.querySelector(`[data-message-id="${highlightedMessageId}"]`);
    el?.scrollIntoView({ block: "center" });
    const handle = setTimeout(() => setHighlightedMessageId(null), 2000);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlightedMessageId, messages.length]);

  const handleJumpToResult = async (messageId) => {
    setMsgSearchOpen(false);
    setMsgSearchQuery("");
    setMsgSearchResults([]);
    if (messages.some((m) => m.id === messageId)) {
      setHighlightedMessageId(messageId);
      return;
    }
    try {
      await jumpToMessage(messageId);
      setHighlightedMessageId(messageId);
    } catch (err) {
      console.error("Không thể chuyển đến tin nhắn:", err);
    }
  };

  const send = () => {
    if (!text.trim() && !pendingImage && !pendingFile) return;
    sendMessage(text, pendingImage, pendingFile);
    setText("");
    setPendingImage(null);
    setPendingFile(null);
  };

  const pickImage = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file);
      setPendingImage(url);
      setPendingFile(null);
    } catch (err) {
      console.error("Không thể tải ảnh lên:", err);
    } finally {
      setUploading(false);
    }
  };

  const pickAttachment = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const uploaded = await uploadFile(file);
      setPendingFile({ url: uploaded.url, name: uploaded.name, size: uploaded.size, type: uploaded.contentType });
      setPendingImage(null);
    } catch (err) {
      console.error("Không thể tải tệp lên:", err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {loading ? (
        <ForumRoomSkeleton />
      ) : (
        <div className="bg-zm-card rounded-2xl border border-zm-border overflow-hidden flex flex-col h-[calc(100vh-17rem)] lg:h-[calc(100vh-13rem)]">
          <div className="relative shrink-0" ref={msgSearchRef}>
          <div className="flex items-center gap-3 px-4 h-16 border-b border-zm-border">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-zm-blue to-zm-blue-light flex items-center justify-center text-white glow-violet shrink-0">
              <FaComments size={16} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm">Phòng chat chung Mingo</p>
              <p className="text-xs text-zm-muted">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1" aria-hidden="true" />
                Đang hoạt động
              </p>
            </div>
            <button
              type="button"
              onClick={() => setMsgSearchOpen((v) => !v)}
              aria-label="Tìm kiếm tin nhắn"
              aria-expanded={msgSearchOpen}
              className={`ml-auto p-2.5 rounded-full hover:bg-zm-hover text-zm-blue-light ${msgSearchOpen ? "bg-zm-hover" : ""}`}
            >
              <FaSearch size={15} aria-hidden="true" />
            </button>
          </div>

          {msgSearchOpen && (
            <div className="absolute top-full left-0 right-0 z-20 bg-zm-card border-b border-zm-border shadow-2xl max-h-96 flex flex-col glow-violet">
              <div className="p-2.5 border-b border-zm-border flex items-center gap-2 shrink-0">
                <FaSearch className="text-zm-muted text-xs shrink-0 ml-1" aria-hidden="true" />
                <input
                  autoFocus
                  value={msgSearchQuery}
                  onChange={(e) => setMsgSearchQuery(e.target.value)}
                  aria-label="Nhập từ khoá tìm kiếm tin nhắn"
                  placeholder="Tìm kiếm tin nhắn trong diễn đàn..."
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
                      <Avatar src={m.author.avatar} alt="" className="w-8 h-8 shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-2">
                          <p className="text-xs font-semibold truncate">{m.author.name}</p>
                          <p className="text-[10px] text-zm-muted shrink-0">
                            {new Date(m.createdAt).toLocaleDateString("vi-VN")} {m.time}
                          </p>
                        </div>
                        <p className="text-xs text-zm-muted truncate">{m.content}</p>
                      </div>
                    </button>
                  ))}
              </div>
            </div>
          )}
          </div>

          <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto p-4 flex flex-col gap-2 bg-zm-bg/40">
            {loadingOlder && (
              <div className="text-center text-xs text-zm-muted py-1">Đang tải tin nhắn cũ hơn...</div>
            )}
            {messages.map((m, i) => {
              const isMe = m.author.id === currentUser.id;
              const prevSameAuthor = messages[i - 1]?.author.id === m.author.id;
              const isReported = m.reportedByMe;
              const isLiked = m.likedBy?.some((p) => p.id === currentUser.id);
              if (m.recalled) {
                return (
                  <div
                    key={m.id}
                    data-message-id={m.id}
                    className={`flex items-end gap-2 max-w-[75%] rounded-2xl transition-colors duration-1000 ${
                      isMe ? "self-end flex-row-reverse" : "self-start"
                    } ${highlightedMessageId === m.id ? "bg-zm-blue/20" : ""}`}
                  >
                    {!isMe && (
                      <div className={`shrink-0 ${prevSameAuthor ? "invisible" : ""}`}>
                        <Avatar src={m.author.avatar} alt="" className="w-7 h-7" />
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
                  className={`group flex items-end gap-2 max-w-[75%] rounded-2xl transition-colors duration-1000 ${
                    isMe ? "self-end flex-row-reverse" : "self-start"
                  } ${highlightedMessageId === m.id ? "bg-zm-blue/20" : ""}`}
                >
                  {!isMe && (
                    <Link
                      to={`/profile/${m.author.id}`}
                      className={`shrink-0 ${prevSameAuthor ? "invisible" : ""}`}
                      tabIndex={prevSameAuthor ? -1 : 0}
                    >
                      <Avatar src={m.author.avatar} alt="" className="w-7 h-7" />
                    </Link>
                  )}
                  <div className="min-w-0">
                    {!isMe && !prevSameAuthor && (
                      <Link
                        to={`/profile/${m.author.id}`}
                        className="text-xs font-semibold text-zm-blue-light hover:underline px-1"
                      >
                        {m.author.name}
                      </Link>
                    )}
                    {m.image && (
                      <img
                        src={m.image}
                        alt="Ảnh đính kèm trong tin nhắn"
                        onClick={() => setLightboxImage(m.image)}
                        className="max-w-[220px] rounded-2xl border border-zm-border mt-0.5 mb-1 cursor-pointer"
                      />
                    )}
                    {m.file && <MessageAttachment file={m.file} />}
                    {m.content && (
                      <div
                        className={`px-3.5 py-2 rounded-2xl text-sm mt-0.5 ${
                          isMe ? "bg-zm-blue text-white" : "bg-zm-card border border-zm-border"
                        }`}
                      >
                        {m.content}
                      </div>
                    )}
                    {m.likedBy?.length > 0 && (
                      <div
                        className={`flex items-center gap-1 ${isMe ? "justify-end" : "justify-start"} mt-0.5 px-1`}
                        aria-label={`${m.likedBy.map((p) => p.name).join(", ")} đã thả tim tin nhắn này`}
                      >
                        <FaHeart className="text-zm-heart" size={11} aria-hidden="true" />
                        {m.likedBy.length > 1 && <span className="text-[10px] text-zm-muted">{m.likedBy.length}</span>}
                      </div>
                    )}
                  </div>

                  <div className="relative shrink-0 self-center flex items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => toggleLikeMessage(m.id)}
                      aria-label={isLiked ? "Bỏ thả tim tin nhắn" : "Thả tim tin nhắn"}
                      className={`w-11 h-11 flex items-center justify-center rounded-full transition-opacity ${
                        isLiked
                          ? "text-zm-heart opacity-100"
                          : "text-zm-muted opacity-100 sm:opacity-0 sm:group-hover:opacity-100 hover:text-zm-heart hover:bg-zm-hover"
                      }`}
                    >
                      {isLiked ? <FaHeart size={12} aria-hidden="true" /> : <FaRegHeart size={12} aria-hidden="true" />}
                    </button>

                    {isMe && (
                      <button
                        type="button"
                        onClick={() => recallMessage(m.id)}
                        aria-label="Thu hồi tin nhắn"
                        className="w-11 h-11 flex items-center justify-center rounded-full text-zm-muted opacity-100 sm:opacity-0 sm:group-hover:opacity-100 hover:text-zm-heart hover:bg-zm-hover transition-opacity"
                      >
                        <FaUndoAlt size={11} aria-hidden="true" />
                      </button>
                    )}

                    {!isMe && (
                      <>
                      <button
                        ref={(el) => {
                          getReportButtonRef(m.id).current = el;
                        }}
                        type="button"
                        onClick={() =>
                          isReported
                            ? unreportMessage(m.id)
                            : setReportMenuFor(reportMenuFor === m.id ? null : m.id)
                        }
                        aria-label={isReported ? `Gỡ báo cáo tin nhắn của ${m.author.name}` : `Báo cáo tin nhắn của ${m.author.name}`}
                        aria-haspopup={isReported ? undefined : "true"}
                        className={`w-11 h-11 flex items-center justify-center rounded-full transition-opacity ${
                          isReported
                            ? "text-zm-orange opacity-100 hover:bg-zm-hover"
                            : "text-zm-muted opacity-100 sm:opacity-0 sm:group-hover:opacity-100 hover:text-zm-blue-light hover:bg-zm-hover"
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
                              reportMessage(m.id, reason);
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

          <div className="p-3 border-t border-zm-border shrink-0 flex items-center gap-2">
            <Avatar src={currentUser.avatar} alt="" className="w-8 h-8 shrink-0" />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Đính kèm ảnh"
              className="w-11 h-11 flex items-center justify-center text-zm-blue-light hover:bg-zm-hover rounded-full shrink-0"
            >
              <FaImage size={16} aria-hidden="true" />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" hidden aria-label="Chọn ảnh để đính kèm" onChange={pickImage} />
            <button
              type="button"
              onClick={() => attachmentInputRef.current?.click()}
              aria-label="Đính kèm video hoặc tệp"
              className="w-11 h-11 flex items-center justify-center text-zm-blue-light hover:bg-zm-hover rounded-full shrink-0"
            >
              <FaPaperclip size={16} aria-hidden="true" />
            </button>
            <input
              ref={attachmentInputRef}
              type="file"
              accept="video/mp4,video/webm,video/quicktime,video/ogg,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar"
              hidden
              aria-label="Chọn video hoặc tệp để đính kèm"
              onChange={pickAttachment}
            />
            <div className="flex-1 min-w-0 flex items-center bg-zm-bg border border-zm-border rounded-full pl-4 pr-1">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                aria-label="Nhập tin nhắn vào phòng chat chung"
                placeholder="Nhắn gì đó với mọi người..."
                className="flex-1 min-w-0 bg-transparent outline-none text-sm py-2.5 placeholder-zm-muted"
              />
              <button
                type="button"
                onClick={send}
                disabled={(!text.trim() && !pendingImage && !pendingFile) || uploading}
                aria-label="Gửi tin nhắn"
                className="w-11 h-11 flex items-center justify-center shrink-0 text-zm-blue-light disabled:text-zm-muted"
              >
                <FaPaperPlane size={14} aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      )}

      {lightboxImage && (
        <ImageLightbox images={[lightboxImage]} index={0} onClose={() => setLightboxImage(null)} onNavigate={() => {}} />
      )}
    </div>
  );
}
