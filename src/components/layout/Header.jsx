import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaHome,
  FaUserFriends,
  FaComments,
  FaBell,
  FaCaretDown,
  FaCog,
} from "react-icons/fa";
import { useCurrentUser } from "../../context/UserContext";
import { useNotifications } from "../../context/NotificationContext";
import NotificationDropdown from "./NotificationDropdown";
import Avatar from "../common/Avatar";
import SearchBar from "./SearchBar";
import ThemeToggle from "./ThemeToggle";

export default function Header() {
  const [showNoti, setShowNoti] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const navigate = useNavigate();
  const { currentUser, logout } = useCurrentUser();
  const { notifications } = useNotifications();
  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-zm-card/80 backdrop-blur-xl border-b border-zm-border z-50">
      <div className="max-w-[1200px] mx-auto h-full relative flex items-center px-2 sm:px-4 gap-3">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <span className="font-extrabold text-xl tracking-wide glow-text">
            Mingo
          </span>
        </Link>

        <SearchBar />

        <nav className="hidden md:flex items-center gap-1 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <Link
            to="/"
            aria-label="Bảng tin"
            className="w-24 h-11 flex items-center justify-center rounded-lg text-zm-muted hover:text-zm-blue-light hover:bg-zm-hover transition-colors"
          >
            <FaHome size={22} aria-hidden="true" />
          </Link>
          <Link
            to="/friends"
            aria-label="Bạn bè"
            className="w-24 h-11 flex items-center justify-center rounded-lg text-zm-muted hover:text-zm-blue-light hover:bg-zm-hover transition-colors"
          >
            <FaUserFriends size={22} aria-hidden="true" />
          </Link>
          <Link
            to="/forum"
            aria-label="Diễn đàn"
            className="w-24 h-11 flex items-center justify-center rounded-lg text-zm-muted hover:text-zm-blue-light hover:bg-zm-hover transition-colors"
          >
            <FaComments size={22} aria-hidden="true" />
          </Link>
        </nav>

        <div className="flex items-center gap-2 ml-auto shrink-0">
          <ThemeToggle />

          <div className="relative">
            <button
              onClick={() => setShowNoti((v) => !v)}
              aria-label={`Thông báo${unreadCount > 0 ? ` (${unreadCount} chưa đọc)` : ""}`}
              aria-expanded={showNoti}
              className="w-11 h-11 rounded-full bg-zm-bg hover:bg-zm-hover border border-zm-border flex items-center justify-center text-zm-muted hover:text-zm-blue-light relative transition-colors"
            >
              <FaBell size={18} aria-hidden="true" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-zm-orange text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow-[0_0_8px_rgba(236,72,153,0.8)]">
                  {unreadCount}
                </span>
              )}
            </button>
            {showNoti && <NotificationDropdown onClose={() => setShowNoti(false)} />}
          </div>

          <div className="relative">
            <button
              onClick={() => setShowMenu((v) => !v)}
              aria-label="Mở menu tài khoản"
              aria-expanded={showMenu}
              className="flex items-center gap-1.5 pl-1 pr-2 min-h-11 rounded-full bg-zm-bg hover:bg-zm-hover border border-zm-border transition-colors"
            >
              <Avatar
                src={currentUser.avatar}
                alt=""
                className="w-8 h-8 bg-zm-card ring-2 ring-zm-blue/50"
              />
              <FaCaretDown className="text-zm-muted text-xs" aria-hidden="true" />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-12 w-56 bg-zm-card rounded-xl shadow-2xl border border-zm-border py-2 text-sm glow-violet">
                <Link
                  to="/profile"
                  onClick={() => setShowMenu(false)}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-zm-hover"
                >
                  <Avatar src={currentUser.avatar} alt="" className="w-8 h-8" />
                  <div>
                    <div className="font-semibold">{currentUser.name}</div>
                    <div className="text-xs text-zm-muted">Xem trang cá nhân</div>
                  </div>
                </Link>
                <Link
                  to="/settings"
                  onClick={() => setShowMenu(false)}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-zm-hover text-zm-text"
                >
                  <FaCog size={14} aria-hidden="true" className="text-zm-muted" />
                  Cài đặt
                </Link>
                <hr className="my-2 border-zm-border" />
                <button
                  onClick={() => {
                    setShowMenu(false);
                    logout();
                    navigate("/login");
                  }}
                  className="w-full text-left px-4 py-2.5 hover:bg-zm-hover text-zm-text"
                >
                  Đăng xuất
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
