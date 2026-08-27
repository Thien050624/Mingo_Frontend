import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
import { useNotifications } from "../context/NotificationContext";
import Avatar from "../components/common/Avatar";
import NotificationsSkeleton from "../components/layout/NotificationsSkeleton";
import { SlowLoadBanner } from "../components/common/LoadingIndicator";

const iconFor = (type) => {
  switch (type) {
    case "like":
      return <FaThumbsUp className="text-white" size={13} aria-hidden="true" />;
    case "comment":
      return <FaComment className="text-white" size={13} aria-hidden="true" />;
    case "follow":
      return <FaUserPlus className="text-white" size={13} aria-hidden="true" />;
    case "moderation":
      return <FaExclamationTriangle className="text-white" size={13} aria-hidden="true" />;
    default:
      return <FaUserFriends className="text-white" size={13} aria-hidden="true" />;
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

export default function Notifications() {
  const { notifications: items, loading, markRead, markAllRead, deleteNotification, deleteAllNotifications } =
    useNotifications();
  const navigate = useNavigate();
  const [confirmingDeleteAll, setConfirmingDeleteAll] = useState(false);

  if (loading) {
    return (
      <>
        <SlowLoadBanner className="mb-3" />
        <NotificationsSkeleton />
      </>
    );
  }

  const openNotification = (n) => {
    markRead(n.id);
    if (n.postId) {
      navigate("/", { state: { scrollToPostId: n.postId } });
    } else if (!n.raw) {
      navigate(`/profile/${n.user.id}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-zm-card rounded-2xl border border-zm-border overflow-hidden">
        {confirmingDeleteAll ? (
          <div className="px-4 py-3 border-b border-zm-border">
            <p className="text-sm mb-2.5">Xoá vĩnh viễn toàn bộ thông báo? Hành động này không thể hoàn tác.</p>
            <div className="flex gap-2 max-w-xs">
              <button
                type="button"
                onClick={() => setConfirmingDeleteAll(false)}
                className="flex-1 min-h-11 text-sm font-semibold rounded-lg border border-zm-border hover:bg-zm-hover transition-colors"
              >
                Huỷ
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteAllNotifications();
                  setConfirmingDeleteAll(false);
                }}
                className="flex-1 min-h-11 text-sm font-semibold rounded-lg bg-zm-heart text-white hover:opacity-90 transition-opacity"
              >
                Xoá tất cả
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between px-4 py-3 border-b border-zm-border">
            <h1 className="font-bold text-xl">Thông báo</h1>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={markAllRead}
                className="flex items-center gap-1.5 min-h-11 text-xs font-semibold text-zm-blue-light hover:bg-zm-hover px-2.5 rounded-lg"
              >
                <FaCheckDouble size={11} aria-hidden="true" /> Đánh dấu đã đọc
              </button>
              {items.length > 0 && (
                <button
                  type="button"
                  onClick={() => setConfirmingDeleteAll(true)}
                  aria-label="Xoá toàn bộ thông báo"
                  title="Xoá toàn bộ thông báo"
                  className="flex items-center gap-1.5 min-h-11 text-xs font-semibold text-zm-muted hover:text-zm-heart hover:bg-zm-hover px-2.5 rounded-lg"
                >
                  <FaTrash size={11} aria-hidden="true" /> Xoá tất cả
                </button>
              )}
            </div>
          </div>
        )}
        <div>
          {items.length === 0 ? (
            <div className="py-10 text-center text-sm text-zm-muted">Chưa có thông báo nào.</div>
          ) : (
            items.map((n) => (
              <div
                key={n.id}
                className={`group relative flex gap-3 px-4 py-3 transition-colors ${n.unread ? "bg-zm-blue/10" : ""}`}
              >
                {n.raw ? (
                  <div
                    aria-hidden="true"
                    className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${bgFor(n.type)}`}
                  >
                    {iconFor(n.type)}
                  </div>
                ) : (
                  <Link to={`/profile/${n.user.id}`} className="relative shrink-0">
                    <Avatar src={n.user.avatar} alt={`Ảnh đại diện của ${n.user.name}`} className="w-12 h-12" />
                    <div
                      aria-hidden="true"
                      className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center ring-2 ring-zm-card ${bgFor(
                        n.type
                      )}`}
                    >
                      {iconFor(n.type)}
                    </div>
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => openNotification(n)}
                  aria-label={`${n.raw ? n.content : `${n.user.name} ${n.content}`}, ${n.time}${n.unread ? ", chưa đọc" : ""}`}
                  className="flex-1 min-w-0 flex items-start gap-3 text-left hover:bg-zm-hover -mx-1 px-1 py-1 rounded-lg transition-colors"
                >
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
                    <span aria-hidden="true" className="w-2.5 h-2.5 rounded-full bg-zm-blue mt-1 shrink-0" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => deleteNotification(n.id)}
                  aria-label="Xoá thông báo"
                  className="self-start shrink-0 w-11 h-11 flex items-center justify-center text-zm-muted hover:text-zm-heart hover:bg-zm-hover rounded-full opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                >
                  <FaTimes size={12} aria-hidden="true" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
