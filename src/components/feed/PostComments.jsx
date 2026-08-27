import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FaPaperPlane, FaEllipsisH, FaArrowLeft, FaFlag } from "react-icons/fa";
import { reportReasons } from "../../data/reportReasons";
import Avatar from "../common/Avatar";
import AnchoredMenu from "../common/AnchoredMenu";

function findComment(comments, id) {
  for (const c of comments) {
    if (c.id === id) return c;
    const reply = (c.replies || []).find((r) => r.id === id);
    if (reply) return reply;
  }
  return null;
}

export default function PostComments({
  comments,
  currentUser,
  commentText,
  setCommentText,
  submitComment,
  replyingTo,
  setReplyingTo,
  replyText,
  setReplyText,
  submitReply,
  toggleCommentLike,
  reportComment,
  unreportComment,
  variant = "inline",
  commentInputRef,
}) {
  const isPanel = variant === "panel";
  const menuAnchorRef = useRef(null);
  const [activeMenu, setActiveMenu] = useState(null);

  const openMenu = (e, id) => {
    menuAnchorRef.current = e.currentTarget;
    setActiveMenu({ id, view: "main" });
  };
  const closeMenu = () => setActiveMenu(null);

  const activeComment = activeMenu ? findComment(comments, activeMenu.id) : null;

  return (
    <div className={isPanel ? "flex flex-col h-full min-h-0" : ""}>
      <div className={isPanel ? "flex-1 min-h-0 overflow-y-auto px-3 pt-3" : "mt-2"}>
        <div className="flex flex-col gap-2">
          {comments.map((c) => (
            <div key={c.id} className="flex flex-col gap-2">
              <div className="flex items-start gap-2">
                <Link to={`/profile/${c.author.id}`} className="shrink-0">
                  <Avatar src={c.author.avatar} alt={`Ảnh đại diện của ${c.author.name}`} className="w-8 h-8" />
                </Link>
                <div>
                  {!isPanel && c.imageUrl && (
                    <img
                      src={c.imageUrl}
                      alt="Ảnh được bình luận"
                      className="w-10 h-10 rounded-lg object-cover mb-1 border border-zm-border"
                    />
                  )}
                  <div className="bg-zm-bg border border-zm-border rounded-2xl px-3 py-1.5 inline-block">
                    <Link
                      to={`/profile/${c.author.id}`}
                      className="text-xs font-semibold text-zm-blue-light hover:underline"
                    >
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
                    {c.author.id !== currentUser.id && (
                      <button
                        type="button"
                        onClick={(e) => openMenu(e, c.id)}
                        aria-label="Tùy chọn bình luận"
                        className="w-11 h-11 -my-2.5 -mr-2 flex items-center justify-center text-zm-muted hover:text-zm-blue-light shrink-0"
                      >
                        <FaEllipsisH size={11} aria-hidden="true" />
                      </button>
                    )}
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
                      <Link
                        to={`/profile/${r.author.id}`}
                        className="text-xs font-semibold text-zm-blue-light hover:underline"
                      >
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
                      {r.author.id !== currentUser.id && (
                        <button
                          type="button"
                          onClick={(e) => openMenu(e, r.id)}
                          aria-label="Tùy chọn bình luận"
                          className="w-11 h-11 -my-2.5 -mr-2 flex items-center justify-center text-zm-muted hover:text-zm-blue-light shrink-0"
                        >
                          <FaEllipsisH size={11} aria-hidden="true" />
                        </button>
                      )}
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
          {comments.length === 0 && isPanel && (
            <p className="text-center text-sm text-zm-muted py-6">Chưa có bình luận nào</p>
          )}
        </div>
      </div>

      <div className={isPanel ? "shrink-0 border-t border-zm-border p-3" : "mt-3"}>
        <div className="flex items-center gap-2">
          <Avatar src={currentUser.avatar} alt="" className="w-8 h-8 shrink-0" />
          <div className="flex-1 min-w-0 flex items-center bg-zm-bg border border-zm-border rounded-full pl-3 pr-1">
            <input
              ref={commentInputRef}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitComment()}
              aria-label="Viết bình luận"
              placeholder="Viết bình luận..."
              className="flex-1 min-w-0 bg-transparent outline-none text-sm py-2 placeholder-zm-muted"
            />
            <button
              type="button"
              onClick={() => submitComment()}
              disabled={!commentText.trim()}
              aria-label="Gửi bình luận"
              className="w-11 h-11 flex items-center justify-center shrink-0 text-zm-blue-light disabled:text-zm-muted"
            >
              <FaPaperPlane size={13} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      <AnchoredMenu
        anchorRef={menuAnchorRef}
        open={activeMenu?.view === "main"}
        onClose={closeMenu}
        align="right"
        className="w-52 bg-zm-card border border-zm-border rounded-xl shadow-2xl py-1.5 z-50 glow-violet"
      >
        {activeComment?.reportedByMe ? (
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              unreportComment(activeComment.id);
              closeMenu();
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-zm-hover transition-colors"
          >
            <FaFlag className="text-zm-muted" size={13} aria-hidden="true" />
            Gỡ báo cáo
          </button>
        ) : (
          <button
            type="button"
            role="menuitem"
            onClick={() => setActiveMenu((m) => ({ ...m, view: "report" }))}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-zm-hover transition-colors"
          >
            <FaFlag className="text-zm-orange" size={13} aria-hidden="true" />
            Báo cáo bình luận
          </button>
        )}
      </AnchoredMenu>

      <AnchoredMenu
        anchorRef={menuAnchorRef}
        open={activeMenu?.view === "report"}
        onClose={closeMenu}
        align="right"
        className="w-56 bg-zm-card border border-zm-border rounded-xl shadow-2xl py-1.5 z-50 glow-violet"
      >
        <button
          type="button"
          onClick={() => setActiveMenu((m) => ({ ...m, view: "main" }))}
          className="w-full flex items-center gap-2 px-4 py-2 text-xs font-semibold text-zm-muted hover:text-zm-blue-light"
        >
          <FaArrowLeft size={10} aria-hidden="true" /> Quay lại
        </button>
        <p className="px-4 pb-1.5 text-xs text-zm-muted">Vì sao bạn báo cáo bình luận này?</p>
        {reportReasons.map((reason) => (
          <button
            key={reason}
            type="button"
            role="menuitem"
            onClick={() => {
              reportComment(activeComment.id, reason);
              closeMenu();
            }}
            className="w-full text-left px-4 py-2.5 text-sm hover:bg-zm-hover transition-colors"
          >
            {reason}
          </button>
        ))}
      </AnchoredMenu>
    </div>
  );
}
