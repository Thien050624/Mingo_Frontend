import { useEffect, useState } from "react";
import { FaTimes } from "react-icons/fa";
import { useCurrentUser } from "../../context/UserContext";

const SESSION_KEY = "mingo-welcome-seen";

export default function WelcomeBanner({ postCount }) {
  const { currentUser } = useCurrentUser();
  const [compact, setCompact] = useState(() => sessionStorage.getItem(SESSION_KEY) === "1");

  useEffect(() => {
    sessionStorage.setItem(SESSION_KEY, "1");
  }, []);

  if (compact) {
    return (
      <button
        type="button"
        onClick={() => setCompact(false)}
        aria-label="Mở rộng thông báo chào mừng"
        className="w-full flex items-center gap-2 rounded-xl border border-zm-border bg-zm-card px-4 py-2.5 mb-5 text-left hover:bg-zm-hover transition-colors"
      >
        <span className="text-sm">
          Chào mừng trở lại, <span className="font-semibold glow-text">{currentUser.name}</span>
        </span>
        <span className="text-xs text-zm-muted ml-auto shrink-0">
          {postCount} bài viết mới
        </span>
      </button>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-zm-border bg-gradient-to-br from-zm-blue/25 via-zm-card to-zm-card p-5 mb-5">
      <div className="absolute -top-16 -right-10 w-52 h-52 rounded-full bg-zm-blue-light/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-10 w-40 h-40 rounded-full bg-zm-orange/10 blur-3xl pointer-events-none" />

      <button
        type="button"
        onClick={() => setCompact(true)}
        aria-label="Thu gọn thông báo chào mừng"
        className="absolute top-3 right-3 w-11 h-11 flex items-center justify-center text-zm-muted hover:text-zm-text hover:bg-zm-hover rounded-full transition-colors"
        title="Thu gọn"
      >
        <FaTimes size={12} aria-hidden="true" />
      </button>

      <p className="relative text-xs font-semibold uppercase tracking-widest text-zm-blue-light">
        Chào mừng trở lại
      </p>
      <h1 className="relative text-2xl font-extrabold mt-1 pr-6">
        Có gì mới hôm nay, <span className="glow-text">{currentUser.name}</span>?
      </h1>
      <p className="relative text-sm text-zm-muted mt-1">
        {postCount} bài viết mới từ bạn bè · {currentUser.followersCount} người theo dõi
      </p>
    </div>
  );
}
