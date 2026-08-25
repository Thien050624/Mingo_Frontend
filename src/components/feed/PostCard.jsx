import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaThumbsUp,
  FaComment,
  FaEllipsisH,
  FaGlobeAsia,
  FaUserFriends,
  FaLock,
  FaPaperPlane,
  FaBookmark,
  FaRegBookmark,
  FaFlag,
  FaArrowLeft,
  FaPen,
  FaTrash,
  FaTimes,
  FaChevronDown,
  FaImage,
} from "react-icons/fa";
import { reactionIcons, reactionKeys } from "../../data/mockData";
import { useCurrentUser } from "../../context/UserContext";
import { useToast } from "../../context/ToastContext";
import { useSaved } from "../../context/SavedContext";
import * as postsApi from "../../api/posts";
import * as uploadsApi from "../../api/uploads";
import PostImageGrid from "./PostImageGrid";
import Avatar from "../common/Avatar";
import AnchoredMenu from "../common/AnchoredMenu";

const visibilityMeta = {
  PUBLIC: { icon: FaGlobeAsia, label: "Công khai" },
  FRIENDS: { icon: FaUserFriends, label: "Bạn bè" },
  PRIVATE: { icon: FaLock, label: "Chỉ mình tôi" },
};

const visibilityOptions = [
  { value: "PUBLIC", ...visibilityMeta.PUBLIC },
  { value: "FRIENDS", ...visibilityMeta.FRIENDS },
  { value: "PRIVATE", ...visibilityMeta.PRIVATE },
];

const reactionLabels = {
  like: "Thích",
  love: "Yêu thích",
  haha: "Haha",
  wow: "Wow",
  sad: "Buồn",
  angry: "Phẫn nộ",
};

const reportReasons = ["Spam", "Nội dung không phù hợp", "Quấy rối / thù ghét", "Khác"];

export default function PostCard({ post, onUpdated, onDeleted }) {
  const [reactions, setReactions] = useState(post.reactions);
  const [myReaction, setMyReaction] = useState(post.myReaction);
  const [showPicker, setShowPicker] = useState(false);
  const pickerHideTimeoutRef = useRef(null);
  const [showComments, setShowComments] = useState(post.comments.length > 0);
  const [comments, setComments] = useState(post.comments);
  const [commentText, setCommentText] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const [menuView, setMenuView] = useState("main");
  const [reported, setReported] = useState(!!post.reportedByMe);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(post.content);
  const [editVisibility, setEditVisibility] = useState(post.visibility);
  const [editImages, setEditImages] = useState([]);
  const [showEditVisibility, setShowEditVisibility] = useState(false);
  const [editError, setEditError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const menuButtonRef = useRef(null);
  const visibilityButtonRef = useRef(null);
  const editFileRef = useRef(null);
  const { currentUser } = useCurrentUser();
  const { showToast } = useToast();
  const { addSavedPost, removeSavedPost } = useSaved();
  const [saved, setSaved] = useState(!!post.savedByMe);
  const isOwn = post.author.id === currentUser.id;
  const editVisibilityMeta = visibilityOptions.find((v) => v.value === editVisibility);

  const toggleSave = async () => {
    const next = !saved;
    setSaved(next);
    closeMenu();
    try {
      if (next) {
        await postsApi.savePost(post.id);
        addSavedPost({ ...post, savedByMe: true });
      } else {
        await postsApi.unsavePost(post.id);
        removeSavedPost(post.id);
      }
      showToast(next ? "Đã lưu bài viết" : "Đã bỏ lưu bài viết");
    } catch (err) {
      setSaved(!next);
      showToast(err.message || "Không thể cập nhật", "error");
    }
  };

  const closeMenu = () => {
    setShowMenu(false);
    setMenuView("main");
  };

  const startEdit = () => {
    setEditText(post.content);
    setEditVisibility(post.visibility);
    setEditImages(post.images.map((url) => ({ type: "existing", url })));
    setEditError("");
    setEditing(true);
    closeMenu();
  };

  const cancelEdit = () => {
    editImages.forEach((img) => img.type === "new" && URL.revokeObjectURL(img.preview));
    setEditing(false);
    setShowEditVisibility(false);
    setEditError("");
  };

  const handleEditFiles = (e) => {
    const files = Array.from(e.target.files || []);
    const items = files.map((f) => ({ type: "new", file: f, preview: URL.createObjectURL(f) }));
    setEditImages((prev) => [...prev, ...items]);
  };

  const removeEditImage = (idx) => {
    setEditImages((prev) => {
      const item = prev[idx];
      if (item.type === "new") URL.revokeObjectURL(item.preview);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const saveEdit = async () => {
    if (!editText.trim() && editImages.length === 0) return;
    setEditError("");
    setSaving(true);
    try {
      const finalImages = await Promise.all(
        editImages.map((img) => (img.type === "existing" ? img.url : uploadsApi.uploadImage(img.file)))
      );
      const updated = await postsApi.updatePost(post.id, {
        content: editText.trim(),
        images: finalImages,
        visibility: editVisibility,
      });
      editImages.forEach((img) => img.type === "new" && URL.revokeObjectURL(img.preview));
      onUpdated?.(postsApi.toFrontendPost(updated));
      setEditing(false);
      showToast("Đã cập nhật bài viết");
    } catch (err) {
      setEditError(err.message || "Đã có lỗi xảy ra, vui lòng thử lại sau");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await postsApi.deletePost(post.id);
      onDeleted?.(post.id);
      showToast("Đã xoá bài viết");
    } catch (err) {
      showToast(err.message || "Không thể xoá bài viết", "error");
      setDeleting(false);
      closeMenu();
    }
  };

  const totalReactions = Object.values(reactions).reduce((a, b) => a + b, 0);
  const topReactions = Object.entries(reactions)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([k]) => k);

  const openPicker = () => {
    clearTimeout(pickerHideTimeoutRef.current);
    setShowPicker(true);
  };

  // Small grace delay before hiding: without it, the brief mouse transit between
  // the "Thích" button and the picker above it registers as leaving, closing the
  // picker before the user can reach a reaction.
  const scheduleClosePicker = () => {
    clearTimeout(pickerHideTimeoutRef.current);
    pickerHideTimeoutRef.current = setTimeout(() => setShowPicker(false), 200);
  };

  const pick = async (key) => {
    const wasReacted = myReaction === key;
    setReactions((prev) => {
      const next = { ...prev };
      if (myReaction) next[myReaction] -= 1;
      if (!wasReacted) next[key] = (next[key] || 0) + 1;
      return next;
    });
    setMyReaction(wasReacted ? null : key);
    clearTimeout(pickerHideTimeoutRef.current);
    setShowPicker(false);

    try {
      if (wasReacted) {
        await postsApi.removeReaction(post.id);
      } else {
        await postsApi.setReaction(post.id, key.toUpperCase());
      }
    } catch (err) {
      console.error("Không thể cập nhật cảm xúc:", err);
    }
  };

  const toggleLike = () => pick(myReaction ? myReaction : "like");

  const submitComment = async () => {
    if (!commentText.trim()) return;
    const text = commentText;
    setCommentText("");
    try {
      const created = await postsApi.addComment(post.id, text);
      setComments((prev) => [
        ...prev,
        {
          id: created.id,
          author: created.author,
          content: created.content,
          time: "Vừa xong",
          likeCount: 0,
          likedByMe: false,
          replies: [],
        },
      ]);
    } catch (err) {
      console.error("Không thể gửi bình luận:", err);
      setCommentText(text);
    }
  };

  const updateCommentInState = (commentId, updater) => {
    setComments((prev) =>
      prev.map((c) => {
        if (c.id === commentId) return updater(c);
        if (c.replies?.some((r) => r.id === commentId)) {
          return { ...c, replies: c.replies.map((r) => (r.id === commentId ? updater(r) : r)) };
        }
        return c;
      })
    );
  };

  const toggleCommentLike = async (comment) => {
    const wasLiked = comment.likedByMe;
    updateCommentInState(comment.id, (c) => ({
      ...c,
      likedByMe: !wasLiked,
      likeCount: c.likeCount + (wasLiked ? -1 : 1),
    }));
    try {
      if (wasLiked) {
        await postsApi.unlikeComment(post.id, comment.id);
      } else {
        await postsApi.likeComment(post.id, comment.id);
      }
    } catch (err) {
      console.error("Không thể thích bình luận:", err);
      updateCommentInState(comment.id, (c) => ({
        ...c,
        likedByMe: wasLiked,
        likeCount: c.likeCount + (wasLiked ? 1 : -1),
      }));
    }
  };

  const submitReply = async (parentId) => {
    if (!replyText.trim()) return;
    const text = replyText;
    setReplyText("");
    try {
      const created = await postsApi.addComment(post.id, text, parentId);
      setComments((prev) =>
        prev.map((c) =>
          c.id === parentId
            ? {
                ...c,
                replies: [
                  ...(c.replies || []),
                  {
                    id: created.id,
                    author: created.author,
                    content: created.content,
                    time: "Vừa xong",
                    likeCount: 0,
                    likedByMe: false,
                    replies: [],
                  },
                ],
              }
            : c
        )
      );
      setReplyingTo(null);
    } catch (err) {
      console.error("Không thể gửi phản hồi:", err);
      setReplyText(text);
    }
  };

  return (
    <article className="relative bg-zm-card rounded-2xl border border-zm-border mb-5 overflow-hidden transition-shadow hover:shadow-[0_0_0_1px_rgba(139,92,246,0.35),0_10px_35px_-12px_rgba(139,92,246,0.35)]">
      <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-zm-blue via-zm-blue-light to-transparent" />

      <div className="flex items-center gap-2.5 p-3 pb-2">
        <Link to={`/profile/${post.author.id}`} className="shrink-0">
          <Avatar
            src={post.author.avatar}
            alt={`Ảnh đại diện của ${post.author.name}`}
            className="w-10 h-10 ring-2 ring-zm-blue/30"
          />
        </Link>
        <div className="min-w-0">
          <Link
            to={`/profile/${post.author.id}`}
            className="font-semibold text-sm hover:text-zm-blue-light truncate transition-colors block"
          >
            {post.author.name}
          </Link>
          <div className="flex items-center gap-1 text-xs text-zm-muted">
            <span>{post.time}</span>
            {(() => {
              const meta = visibilityMeta[post.visibility] || visibilityMeta.PUBLIC;
              const VIcon = meta.icon;
              return <VIcon size={9} aria-label={meta.label} title={meta.label} />;
            })()}
          </div>
        </div>
        <div className="relative ml-auto shrink-0">
          <button
            ref={menuButtonRef}
            type="button"
            onClick={() => setShowMenu((v) => !v)}
            aria-label="Tùy chọn bài viết"
            aria-expanded={showMenu}
            aria-haspopup="true"
            className="w-11 h-11 flex items-center justify-center text-zm-muted hover:text-zm-blue-light hover:bg-zm-hover rounded-full transition-colors"
          >
            <FaEllipsisH size={14} aria-hidden="true" />
          </button>
          <AnchoredMenu
            anchorRef={menuButtonRef}
            open={showMenu && menuView === "main"}
            onClose={closeMenu}
            align="right"
            className="w-52 bg-zm-card border border-zm-border rounded-xl shadow-2xl py-1.5 z-50 glow-violet"
          >
              <button
                type="button"
                role="menuitem"
                onClick={toggleSave}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-zm-hover transition-colors"
              >
                {saved ? (
                  <FaBookmark className="text-zm-blue-light" size={14} aria-hidden="true" />
                ) : (
                  <FaRegBookmark className="text-zm-muted" size={14} aria-hidden="true" />
                )}
                {saved ? "Bỏ lưu bài viết" : "Lưu bài viết"}
              </button>
              {isOwn ? (
                <>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={startEdit}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-zm-hover transition-colors"
                  >
                    <FaPen className="text-zm-muted" size={12} aria-hidden="true" />
                    Sửa bài viết
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => setMenuView("delete")}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-zm-hover transition-colors"
                  >
                    <FaTrash className="text-zm-heart" size={12} aria-hidden="true" />
                    Xoá bài viết
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  role="menuitem"
                  onClick={async () => {
                    if (reported) {
                      setReported(false);
                      closeMenu();
                      try {
                        await postsApi.unreportPost(post.id);
                        showToast("Đã gỡ báo cáo");
                      } catch (err) {
                        setReported(true);
                        showToast(err.message || "Không thể gỡ báo cáo", "error");
                      }
                    } else {
                      setMenuView("report");
                    }
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-zm-hover transition-colors"
                >
                  <FaFlag className={reported ? "text-zm-muted" : "text-zm-orange"} size={13} aria-hidden="true" />
                  {reported ? "Gỡ báo cáo" : "Báo cáo bài viết"}
                </button>
              )}
          </AnchoredMenu>

          <AnchoredMenu
            anchorRef={menuButtonRef}
            open={showMenu && menuView === "delete"}
            onClose={closeMenu}
            align="right"
            className="w-60 bg-zm-card border border-zm-border rounded-xl shadow-2xl p-3 z-50 glow-violet"
          >
            <p className="text-sm mb-3">Bạn chắc chắn muốn xoá bài viết này? Hành động này không thể hoàn tác.</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMenuView("main")}
                className="flex-1 text-sm font-semibold rounded-lg py-1.5 border border-zm-border hover:bg-zm-hover transition-colors"
              >
                Huỷ
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                className="flex-1 text-sm font-semibold rounded-lg py-1.5 bg-zm-heart text-white hover:opacity-90 disabled:opacity-60 transition-opacity"
              >
                {deleting ? "Đang xoá..." : "Xoá"}
              </button>
            </div>
          </AnchoredMenu>

          <AnchoredMenu
            anchorRef={menuButtonRef}
            open={showMenu && menuView === "report"}
            onClose={closeMenu}
            align="right"
            className="w-56 bg-zm-card border border-zm-border rounded-xl shadow-2xl py-1.5 z-50 glow-violet"
          >
            <button
              type="button"
              onClick={() => setMenuView("main")}
              className="w-full flex items-center gap-2 px-4 py-2 text-xs font-semibold text-zm-muted hover:text-zm-blue-light"
            >
              <FaArrowLeft size={10} aria-hidden="true" /> Quay lại
            </button>
            <p className="px-4 pb-1.5 text-xs text-zm-muted">Vì sao bạn báo cáo bài viết này?</p>
            {reportReasons.map((reason) => (
              <button
                key={reason}
                type="button"
                role="menuitem"
                onClick={async () => {
                  setReported(true);
                  closeMenu();
                  try {
                    await postsApi.reportPost(post.id, reason);
                    showToast("Đã gửi báo cáo, cảm ơn bạn");
                  } catch (err) {
                    setReported(false);
                    showToast(err.message || "Không thể gửi báo cáo", "error");
                  }
                }}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-zm-hover transition-colors"
              >
                {reason}
              </button>
            ))}
          </AnchoredMenu>
        </div>
      </div>

      {editing ? (
        <div className="px-3 pb-3">
          <textarea
            autoFocus
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            aria-label="Sửa nội dung bài viết"
            className="w-full outline-none resize-none text-sm min-h-[70px] bg-zm-bg border border-zm-border rounded-lg p-2.5 placeholder-zm-muted"
          />

          {editImages.length > 0 && (
            <div className="grid grid-cols-3 gap-1.5 mt-2">
              {editImages.map((img, idx) => (
                <div key={idx} className="relative rounded-xl overflow-hidden aspect-square border border-zm-border">
                  <img
                    src={img.type === "existing" ? img.url : img.preview}
                    alt={`Ảnh ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeEditImage(idx)}
                    aria-label={`Xoá ảnh ${idx + 1}`}
                    className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 text-white rounded-full p-1"
                  >
                    <FaTimes size={10} aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <input
            ref={editFileRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            aria-label="Thêm ảnh vào bài viết"
            onChange={handleEditFiles}
          />
          <button
            type="button"
            onClick={() => editFileRef.current?.click()}
            className="flex items-center gap-2 text-sm font-medium text-zm-muted hover:text-emerald-400 hover:bg-zm-hover rounded-lg px-3 py-1.5 mt-2 transition-colors"
          >
            <FaImage className="text-emerald-400" aria-hidden="true" /> Thêm ảnh
          </button>

          <div className="flex items-center justify-between mt-2">
            <div className="relative">
              <button
                ref={visibilityButtonRef}
                type="button"
                onClick={() => setShowEditVisibility((v) => !v)}
                aria-expanded={showEditVisibility}
                aria-haspopup="true"
                className="flex items-center gap-1 text-xs text-zm-blue-light bg-zm-blue/10 hover:bg-zm-blue/20 px-2 py-1 rounded-full transition-colors"
              >
                <editVisibilityMeta.icon size={9} aria-hidden="true" />
                {editVisibilityMeta.label}
                <FaChevronDown size={8} aria-hidden="true" />
              </button>
              <AnchoredMenu
                anchorRef={visibilityButtonRef}
                open={showEditVisibility}
                onClose={() => setShowEditVisibility(false)}
                align="left"
                className="w-44 bg-zm-card border border-zm-border rounded-xl shadow-2xl py-1.5 z-50 glow-violet"
              >
                {visibilityOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setEditVisibility(opt.value);
                      setShowEditVisibility(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-zm-hover transition-colors ${
                      editVisibility === opt.value ? "text-zm-blue-light font-semibold" : "text-zm-text"
                    }`}
                  >
                    <opt.icon size={12} aria-hidden="true" />
                    {opt.label}
                  </button>
                ))}
              </AnchoredMenu>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={cancelEdit}
                aria-label="Huỷ sửa bài viết"
                className="w-11 h-11 flex items-center justify-center text-zm-muted hover:bg-zm-hover rounded-full"
              >
                <FaTimes size={13} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={saveEdit}
                disabled={saving || (!editText.trim() && editImages.length === 0)}
                className="bg-gradient-to-r from-zm-blue to-zm-blue-light disabled:opacity-60 hover:opacity-90 text-white text-sm font-semibold rounded-lg px-4 min-h-11 transition-opacity"
              >
                {saving ? "Đang lưu..." : "Lưu"}
              </button>
            </div>
          </div>
          {editError && <p className="mt-2 text-xs text-zm-heart font-medium">{editError}</p>}
        </div>
      ) : (
        <>
          {post.content && (
            <p className="px-3 pb-2 text-sm whitespace-pre-line leading-relaxed">{post.content}</p>
          )}
          <PostImageGrid images={post.images} authorName={post.author.name} />
        </>
      )}

      <div className="px-3 pt-2 flex items-center justify-between text-xs text-zm-muted">
        <div className="flex items-center gap-1">
          {topReactions.length > 0 && (
            <span className="flex -space-x-1">
              {topReactions.map((k) => (
                <span
                  key={k}
                  className="w-4 h-4 flex items-center justify-center text-[10px] bg-zm-card rounded-full ring-1 ring-zm-card"
                >
                  {reactionIcons[k]}
                </span>
              ))}
            </span>
          )}
          {totalReactions > 0 && <span>{totalReactions}</span>}
        </div>
        <div className="flex items-center gap-3">
          {comments.length > 0 && (
            <button onClick={() => setShowComments((v) => !v)} className="hover:underline">
              {comments.length} bình luận
            </button>
          )}
        </div>
      </div>

      <div className="mx-3 my-1.5 border-t border-zm-border" />

      <div className="px-2 pb-1 flex items-center relative">
        <div
          className="flex-1 relative"
          onMouseEnter={openPicker}
          onMouseLeave={scheduleClosePicker}
        >
          {showPicker && (
            <div className="absolute bottom-full left-0 bg-zm-card shadow-2xl border border-zm-border rounded-full px-2 py-1.5 flex gap-1 z-10 glow-violet">
              {reactionKeys.map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => pick(k)}
                  aria-label={reactionLabels[k]}
                  title={reactionLabels[k]}
                  className="text-2xl hover:scale-125 transition-transform"
                >
                  {reactionIcons[k]}
                </button>
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={toggleLike}
            className={`w-full min-h-11 flex items-center justify-center gap-2 rounded-lg text-sm font-semibold hover:bg-zm-hover transition-colors ${
              myReaction ? "text-zm-blue-light" : "text-zm-muted"
            }`}
          >
            {myReaction ? (
              <span className="text-base leading-none" aria-hidden="true">{reactionIcons[myReaction]}</span>
            ) : (
              <FaThumbsUp size={15} aria-hidden="true" />
            )}
            {myReaction
              ? myReaction === "like"
                ? "Thích"
                : myReaction[0].toUpperCase() + myReaction.slice(1)
              : "Thích"}
          </button>
        </div>

        <button
          type="button"
          onClick={() => setShowComments((v) => !v)}
          className="flex-1 min-h-11 flex items-center justify-center gap-2 rounded-lg text-sm font-semibold text-zm-muted hover:text-zm-blue-light hover:bg-zm-hover transition-colors"
        >
          <FaComment size={15} aria-hidden="true" /> Bình luận
        </button>
      </div>

      {showComments && (
        <div className="px-3 pb-3 pt-1 border-t border-zm-border">
          <div className="flex flex-col gap-2 mt-2">
            {comments.map((c) => (
              <div key={c.id} className="flex flex-col gap-2">
                <div className="flex items-start gap-2">
                  <Link to={`/profile/${c.author.id}`} className="shrink-0">
                    <Avatar src={c.author.avatar} alt={`Ảnh đại diện của ${c.author.name}`} className="w-8 h-8" />
                  </Link>
                  <div>
                    <div className="bg-zm-bg border border-zm-border rounded-2xl px-3 py-1.5 inline-block">
                      <Link to={`/profile/${c.author.id}`} className="text-xs font-semibold text-zm-blue-light hover:underline">
                        {c.author.name}
                      </Link>
                      <p className="text-sm">{c.content}</p>
                    </div>
                    <div className="flex items-center gap-3 px-3 mt-0.5 text-xs text-zm-muted">
                      <button
                        type="button"
                        onClick={() => toggleCommentLike(c)}
                        className={`font-semibold hover:text-zm-blue-light ${c.likedByMe ? "text-zm-blue-light" : ""}`}
                      >
                        Thích{c.likeCount > 0 ? ` (${c.likeCount})` : ""}
                      </button>
                      <button
                        type="button"
                        onClick={() => setReplyingTo(replyingTo === c.id ? null : c.id)}
                        className="font-semibold hover:text-zm-blue-light"
                      >
                        Phản hồi
                      </button>
                      <span>{c.time}</span>
                    </div>
                  </div>
                </div>

                {(c.replies || []).map((r) => (
                  <div key={r.id} className="flex items-start gap-2 ml-10">
                    <Link to={`/profile/${r.author.id}`} className="shrink-0">
                      <Avatar src={r.author.avatar} alt={`Ảnh đại diện của ${r.author.name}`} className="w-7 h-7" />
                    </Link>
                    <div>
                      <div className="bg-zm-bg border border-zm-border rounded-2xl px-3 py-1.5 inline-block">
                        <Link to={`/profile/${r.author.id}`} className="text-xs font-semibold text-zm-blue-light hover:underline">
                          {r.author.name}
                        </Link>
                        <p className="text-sm">{r.content}</p>
                      </div>
                      <div className="flex items-center gap-3 px-3 mt-0.5 text-xs text-zm-muted">
                        <button
                          type="button"
                          onClick={() => toggleCommentLike(r)}
                          className={`font-semibold hover:text-zm-blue-light ${r.likedByMe ? "text-zm-blue-light" : ""}`}
                        >
                          Thích{r.likeCount > 0 ? ` (${r.likeCount})` : ""}
                        </button>
                        <span>{r.time}</span>
                      </div>
                    </div>
                  </div>
                ))}

                {replyingTo === c.id && (
                  <div className="flex items-center gap-2 ml-10">
                    <Avatar src={currentUser.avatar} alt="" className="w-7 h-7 shrink-0" />
                    <div className="flex-1 min-w-0 flex items-center bg-zm-bg border border-zm-border rounded-full pl-3 pr-1">
                      <input
                        autoFocus
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && submitReply(c.id)}
                        aria-label="Viết phản hồi"
                        placeholder={`Phản hồi ${c.author.name}...`}
                        className="flex-1 min-w-0 bg-transparent outline-none text-sm py-1.5 placeholder-zm-muted"
                      />
                      <button
                        type="button"
                        onClick={() => submitReply(c.id)}
                        disabled={!replyText.trim()}
                        aria-label="Gửi phản hồi"
                        className="w-11 h-11 flex items-center justify-center shrink-0 text-zm-blue-light disabled:text-zm-muted"
                      >
                        <FaPaperPlane size={12} aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 mt-3">
            <Avatar src={currentUser.avatar} alt="" className="w-8 h-8 shrink-0" />
            <div className="flex-1 min-w-0 flex items-center bg-zm-bg border border-zm-border rounded-full pl-3 pr-1">
              <input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitComment()}
                aria-label="Viết bình luận"
                placeholder="Viết bình luận..."
                className="flex-1 min-w-0 bg-transparent outline-none text-sm py-2 placeholder-zm-muted"
              />
              <button
                type="button"
                onClick={submitComment}
                disabled={!commentText.trim()}
                aria-label="Gửi bình luận"
                className="w-11 h-11 flex items-center justify-center shrink-0 text-zm-blue-light disabled:text-zm-muted"
              >
                <FaPaperPlane size={13} aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
