import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaUserPlus, FaUserFriends, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import * as friendsApi from "../../api/friends";
import { usePresence } from "../../context/PresenceContext";
import Avatar from "../common/Avatar";

const SUGGESTIONS_PAGE_SIZE = 5;

export default function RightPanel() {
  const { onlineFriends } = usePresence();
  const [suggestions, setSuggestions] = useState([]);
  const [added, setAdded] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);

  useEffect(() => {
    friendsApi
      .listSuggestions()
      .then((res) => setSuggestions(res))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalPages = Math.ceil(suggestions.length / SUGGESTIONS_PAGE_SIZE);
  const visibleSuggestions = suggestions.slice(
    page * SUGGESTIONS_PAGE_SIZE,
    page * SUGGESTIONS_PAGE_SIZE + SUGGESTIONS_PAGE_SIZE
  );

  const sendRequest = async (userId) => {
    try {
      await friendsApi.sendRequest(userId);
      setAdded((prev) => [...prev, userId]);
    } catch (err) {
      console.error("Không thể gửi lời mời kết bạn:", err);
    }
  };

  return (
    <aside className="hidden xl:block w-72 shrink-0 sticky top-[3.75rem] self-start h-[calc(100vh-3.75rem)] overflow-y-auto pb-6 pl-2">
      <div className="bg-zm-card rounded-2xl border border-zm-border p-3 mb-4">
        <h3 className="flex items-center gap-1.5 font-bold text-sm text-zm-muted px-1 mb-2 tracking-wide uppercase text-[11px]">
          <FaUserFriends className="text-zm-blue-light" size={12} aria-hidden="true" /> Gợi ý kết bạn
        </h3>
        <div className="flex flex-col gap-1">
          {loading && <p className="text-xs text-zm-muted px-1 py-2">Đang tải...</p>}
          {!loading && suggestions.length === 0 && (
            <p className="text-xs text-zm-muted px-1 py-2">Chưa có gợi ý kết bạn nào.</p>
          )}
          {!loading &&
            visibleSuggestions.map(({ user, mutualCount }) => (
              <div key={user.id} className="flex items-center gap-2.5 px-1 py-1.5 rounded-xl hover:bg-zm-hover">
                <Link to={`/profile/${user.id}`} className="shrink-0">
                  <Avatar src={user.avatar} alt="" className="w-9 h-9 ring-1 ring-zm-border" />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link
                    to={`/profile/${user.id}`}
                    className="block text-sm font-medium truncate hover:text-zm-blue-light"
                  >
                    {user.name}
                  </Link>
                  {mutualCount > 0 && (
                    <p className="text-xs text-zm-muted truncate">{mutualCount} bạn chung</p>
                  )}
                </div>
                <button
                  type="button"
                  disabled={added.includes(user.id)}
                  onClick={() => sendRequest(user.id)}
                  aria-label={added.includes(user.id) ? `Đã gửi lời mời tới ${user.name}` : `Kết bạn với ${user.name}`}
                  className="shrink-0 p-2 rounded-full bg-zm-blue/15 text-zm-blue-light hover:bg-zm-blue/25 disabled:bg-zm-hover disabled:text-zm-muted transition-colors"
                >
                  <FaUserPlus size={12} aria-hidden="true" />
                </button>
              </div>
            ))}
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 pt-2 mt-1 border-t border-zm-border">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              aria-label="Trang trước"
              className="p-1.5 rounded-full text-zm-muted hover:text-zm-blue-light hover:bg-zm-hover disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-zm-muted transition-colors"
            >
              <FaChevronLeft size={11} aria-hidden="true" />
            </button>
            <span className="text-xs text-zm-muted">
              Trang <span className="font-semibold text-zm-text">{page + 1}</span>/{totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              aria-label="Trang sau"
              className="p-1.5 rounded-full text-zm-muted hover:text-zm-blue-light hover:bg-zm-hover disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-zm-muted transition-colors"
            >
              <FaChevronRight size={11} aria-hidden="true" />
            </button>
          </div>
        )}
      </div>

      <div className="bg-zm-card rounded-2xl border border-zm-border p-3">
        <h3 className="flex items-center gap-1.5 font-bold text-sm text-zm-muted px-1 mb-2 tracking-wide uppercase text-[11px]">
          <span aria-hidden="true" className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)]" />
          Đang hoạt động
        </h3>
        <div className="flex flex-col gap-1">
          {onlineFriends.map((u) => (
            <Link
              key={u.id}
              to={`/profile/${u.id}`}
              aria-label={`${u.name}, đang hoạt động`}
              className="flex items-center gap-2.5 px-1 py-1.5 rounded-xl hover:bg-zm-hover w-full"
            >
              <div className="relative shrink-0">
                <Avatar src={u.avatar} alt="" className="w-8 h-8 ring-1 ring-zm-border" />
                <span
                  aria-hidden="true"
                  className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-zm-card shadow-[0_0_6px_rgba(52,211,153,0.9)]"
                />
              </div>
              <p className="text-sm font-medium truncate">{u.name}</p>
            </Link>
          ))}
          {onlineFriends.length === 0 && (
            <p className="text-xs text-zm-muted px-1 py-2">Không có bạn bè nào đang hoạt động.</p>
          )}
        </div>
      </div>

      <p className="text-[11px] text-zm-muted px-2 mt-4 leading-relaxed">
        Giới thiệu · Trợ giúp · Điều khoản
        <br />
        © {new Date().getFullYear()} Mingo
      </p>
    </aside>
  );
}
