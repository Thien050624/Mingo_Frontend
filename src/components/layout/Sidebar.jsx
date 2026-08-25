import { Link, useLocation } from "react-router-dom";
import {
  FaHome,
  FaUser,
  FaUserFriends,
  FaBell,
  FaCommentDots,
  FaComments,
  FaBookmark,
} from "react-icons/fa";
import { useCurrentUser } from "../../context/UserContext";
import { useChat } from "../../context/ChatContext";
import { useNotifications } from "../../context/NotificationContext";
import Avatar from "../common/Avatar";

const items = [
  { to: "/", label: "Bảng tin", icon: FaHome },
  { to: "/profile", label: "Trang cá nhân", icon: FaUser },
  { to: "/friends", label: "Bạn bè", icon: FaUserFriends },
  { to: "/forum", label: "Diễn đàn", icon: FaComments },
  { to: "/chat", label: "Tin nhắn", icon: FaCommentDots },
  { to: "/notifications", label: "Thông báo", icon: FaBell },
  { to: "/saved", label: "Đã lưu", icon: FaBookmark },
];

export default function Sidebar() {
  const location = useLocation();
  const { currentUser } = useCurrentUser();
  const { totalUnread: unreadMessages } = useChat();
  const { notifications } = useNotifications();

  const unreadNotifications = notifications.filter((n) => n.unread).length;
  const badges = {
    "/chat": unreadMessages,
    "/notifications": unreadNotifications,
  };

  return (
    <aside className="hidden lg:flex w-52 shrink-0 sticky top-[3.75rem] self-start h-[calc(100vh-3.75rem)] flex-col py-5 gap-1">
      <Link
        to="/profile"
        className="flex items-center gap-3 px-3 py-2 mb-2 rounded-2xl hover:bg-zm-hover transition-colors"
      >
        <Avatar
          src={currentUser.avatar}
          alt=""
          className="w-10 h-10 !rounded-2xl ring-2 ring-zm-blue/40"
        />
        <span className="text-sm font-semibold truncate">{currentUser.name}</span>
      </Link>

      <nav className="flex flex-col gap-1 px-2">
        {items.map(({ to, label, icon: Icon }) => {
          const active = to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);
          const badge = badges[to];
          return (
            <Link
              key={to}
              to={to}
              aria-label={badge > 0 ? `${label} (${badge} chưa đọc)` : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium transition-all ${
                active
                  ? "bg-gradient-to-r from-zm-blue to-zm-blue-dark text-white glow-violet"
                  : "text-zm-muted hover:text-zm-blue-light hover:bg-zm-hover"
              }`}
            >
              <Icon size={18} aria-hidden="true" className="shrink-0" />
              <span className="flex-1 truncate">{label}</span>
              {badge > 0 && (
                <span
                  aria-hidden="true"
                  className={`text-[11px] font-bold rounded-full min-w-5 h-5 px-1.5 flex items-center justify-center shrink-0 ${
                    active ? "bg-white/25 text-white" : "bg-zm-orange text-white shadow-[0_0_8px_rgba(236,72,153,0.6)]"
                  }`}
                >
                  {badge > 9 ? "9+" : badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
