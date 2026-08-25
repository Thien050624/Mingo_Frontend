import { Link, useLocation } from "react-router-dom";
import { FaHome, FaUserFriends, FaComments, FaCommentDots, FaBell } from "react-icons/fa";
import { useChat } from "../../context/ChatContext";
import { useNotifications } from "../../context/NotificationContext";

const items = [
  { to: "/", label: "Bảng tin", icon: FaHome },
  { to: "/friends", label: "Bạn bè", icon: FaUserFriends },
  { to: "/forum", label: "Diễn đàn", icon: FaComments },
  { to: "/chat", label: "Tin nhắn", icon: FaCommentDots },
  { to: "/notifications", label: "Thông báo", icon: FaBell },
];

export default function MobileBottomNav() {
  const location = useLocation();
  const { totalUnread: unreadMessages } = useChat();
  const { notifications } = useNotifications();

  const unreadNotifications = notifications.filter((n) => n.unread).length;
  const badges = {
    "/chat": unreadMessages,
    "/notifications": unreadNotifications,
  };

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-zm-card/95 backdrop-blur-xl border-t border-zm-border flex items-stretch h-16 pb-[env(safe-area-inset-bottom)]">
      {items.map(({ to, label, icon: Icon }) => {
        const active = to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);
        const badge = badges[to];
        return (
          <Link
            key={to}
            to={to}
            aria-label={badge > 0 ? `${label} (${badge} chưa đọc)` : label}
            className={`relative flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${
              active ? "text-zm-blue-light" : "text-zm-muted"
            }`}
          >
            <Icon size={19} aria-hidden="true" />
            <span className="text-[10px] font-medium">{label}</span>
            {badge > 0 && (
              <span
                aria-hidden="true"
                className="absolute top-1.5 right-1/2 translate-x-3 bg-zm-orange text-white text-[9px] font-bold rounded-full min-w-4 h-4 px-1 flex items-center justify-center shadow-[0_0_6px_rgba(236,72,153,0.7)]"
              >
                {badge > 9 ? "9+" : badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
