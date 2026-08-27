import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaThumbsUp,
  FaComment,
  FaUserPlus,
  FaUserFriends,
  FaCheckDouble,
  FaTimes,
  FaTrash,
  FaExclamationTriangle,
} from "react-icons/fa";
import { useNotifications } from "../../context/NotificationContext";
import Avatar from "../common/Avatar";

const iconFor = (type) => {
  switch (type) {
    case "like":
      return <FaThumbsUp className="text-white" size={11} aria-hidden="true" />;
    case "comment":
      return <FaComment className="text-white" size={11} aria-hidden="true" />;
    case "follow":
      return <FaUserPlus className="text-white" size={11} aria-hidden="true" />;
    case "moderation":
      return <FaExclamationTriangle className="text-white" size={11} aria-hidden="true" />;
    default:
      return <FaUserFriends className="text-white" size={11} aria-hidden="true" />;
  }
};

const bgFor = (type) => {
  switch (type) {
    case "like":
      return "bg-zm-blue";
    case "comment":
      return "bg-emerald-500";
    case "follow":
      return "bg-zm-orange";
    case "moderation":
      return "bg-zm-heart";
    default:
      return "bg-zm-blue-light";
  }
};

export default function NotificationDropdown({ onClose }) {
  const { notifications, markRead, markAllRead, deleteNotification, deleteAllNotifications } = useNotifications();
  const navigate = useNavigate();
  const [confirmingDeleteAll, setConfirmingDeleteAll] = useState(false);

  const openNotification = (n) => {
    markRead(n.id);
    onClose();
    if (n.postId) {
      navigate("/", { state: { scrollToPostId: n.postId } });
    } else if (!n.raw) {
      navigate(`/profile/${n.user.id}`);
    }
  };

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="fixed sm:absolute left-2 right-2 sm:left-auto sm:right-0 top-16 sm:top-12 w-auto sm:w-80 max-h-[28rem] overflow-y-auto bg-zm-card rounded-xl shadow-2xl border border-zm-border z-50 glow-violet">
        {confirmingDeleteAll ? (
          <div className="px-4 py-3 border-b border-zm-border">
            <p className="text-sm mb-2.5">Xoá vĩnh viễn toàn bộ thông báo? Hành động này không thể hoàn tác.</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmingDeleteAll(false)}
                className="flex-1 min-h-11 text-xs font-semibold rounded-lg border border-zm-border hover:bg-zm-hover transition-colors"
              >
                Huỷ
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteAllNotifications();
                  setConfirmingDeleteAll(false);
                }}
                className="flex-1 min-h-11 text-xs font-semibold rounded-lg bg-zm-heart text-white hover:opacity-90 transition-opacity"
              >
                Xoá tất cả
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between px-4 py-3 border-b border-zm-border">
            <span className="font-bold text-lg">Thông báo</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={markAllRead}
                className="flex items-center gap-1.5 min-h-11 text-xs font-semibold text-zm-blue-light hover:bg-zm-hover px-2 rounded-lg"
              >
                <FaCheckDouble size={10} aria-hidden="true" /> Đánh dấu đã đọc
              </button>
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={() => setConfirmingDeleteAll(true)}
                  aria-label="Xoá toàn bộ thông báo"
                  title="Xoá toàn bộ thông báo"
                  className="min-w-11 min-h-11 flex items-center justify-center text-zm-muted hover:text-zm-heart hover:bg-zm-hover rounded-lg"
                >
                  <FaTrash size={11} aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
        )}
        {notifications.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-zm-muted">Chưa có thông báo nào.</div>
        )}
        {notifications.map((n) => (
          <div key={n.id} className={`group relative flex items-center ${n.unread ? "bg-zm-blue/10" : ""}`}>
            <button
              type="button"
              onClick={() => openNotification(n)}
              aria-label={`${n.raw ? n.content : `${n.user.name} ${n.content}`}, ${n.time}${n.unread ? ", chưa đọc" : ""}`}
              className="flex-1 min-w-0 flex gap-3 px-4 py-3 hover:bg-zm-hover text-left"
            >
              {n.raw ? (
                <div
                  className={`shrink-0 w-11 h-11 rounded-full flex items-center justify-center ${bgFor(n.type)}`}
                >
                  {iconFor(n.type)}
                </div>
              ) : (
                <div className="relative shrink-0">
                  <Avatar src={n.user.avatar} alt="" className="w-11 h-11" />
                  <div
                    className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center ring-2 ring-zm-card ${bgFor(
                      n.type
                    )}`}
                  >
                    {iconFor(n.type)}
                  </div>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm leading-snug">
                  {n.raw ? n.content : (
                    <>
                      <span className="font-semibold">{n.user.name}</span> {n.content}
                    </>
                  )}
                </p>
                <span className="text-xs text-zm-blue-light font-medium">{n.time}</span>
              </div>
              {n.unread && (
                <span
                  aria-hidden="true"
                  className="w-2.5 h-2.5 rounded-full bg-zm-blue mt-1 shrink-0 shadow-[0_0_6px_rgba(139,92,246,0.9)]"
                />
              )}
            </button>
            <button
              type="button"
              onClick={() => deleteNotification(n.id)}
              aria-label="Xoá thông báo"
              className="absolute right-1 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center text-zm-muted hover:text-zm-heart hover:bg-zm-hover rounded-full opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
            >
              <FaTimes size={11} aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
