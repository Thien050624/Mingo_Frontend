import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaSearch, FaHashtag, FaFileAlt } from "react-icons/fa";
import { trendingTopics } from "../../data/mockData";
import * as usersApi from "../../api/users";
import * as postsApi from "../../api/posts";
import Avatar from "../common/Avatar";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [matchedPeople, setMatchedPeople] = useState([]);
  const [matchedPosts, setMatchedPosts] = useState([]);
  const [searching, setSearching] = useState(false);
  const containerRef = useRef(null);
  const requestIdRef = useRef(0);
  const navigate = useNavigate();

  useEffect(() => {
    const onClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    const onKeyDown = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  const q = query.trim();

  useEffect(() => {
    if (!q) {
      setMatchedPeople([]);
      setMatchedPosts([]);
      setSearching(false);
      return;
    }
    const requestId = ++requestIdRef.current;
    setSearching(true);
    const timer = setTimeout(() => {
      Promise.all([usersApi.searchUsers(q, 0, 4), postsApi.searchPosts(q, 0, 4)])
        .then(([usersRes, postsRes]) => {
          if (requestId !== requestIdRef.current) return;
          setMatchedPeople(usersRes.content);
          setMatchedPosts(postsRes.content);
        })
        .catch(() => {
          if (requestId !== requestIdRef.current) return;
          setMatchedPeople([]);
          setMatchedPosts([]);
        })
        .finally(() => {
          if (requestId === requestIdRef.current) setSearching(false);
        });
    }, 300);
    return () => clearTimeout(timer);
  }, [q]);

  const qLower = q.toLowerCase();
  const matchedTags = q ? trendingTopics.filter((t) => t.tag.toLowerCase().includes(qLower)).slice(0, 4) : [];
  const hasResults = matchedPeople.length + matchedPosts.length + matchedTags.length > 0;

  const goToPost = (id) => {
    setOpen(false);
    setQuery("");
    navigate("/", { state: { scrollToPostId: id } });
  };

  return (
    <div ref={containerRef} className="relative flex-1 max-w-[13rem]">
      <div className="flex items-center bg-zm-bg hover:bg-zm-hover focus-within:ring-1 focus-within:ring-zm-blue rounded-full px-3 h-9 transition-colors border border-zm-border">
        <FaSearch className="text-zm-muted text-sm shrink-0" aria-hidden="true" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => query && setOpen(true)}
          aria-label="Tìm kiếm trên Mingo"
          placeholder="Tìm kiếm trên Mingo"
          className="bg-transparent outline-none px-2 text-sm text-zm-text placeholder-zm-muted w-full"
        />
      </div>

      {open && q && (
        <div className="absolute left-0 top-11 w-72 max-w-[calc(100vw-1.5rem)] bg-zm-card border border-zm-border rounded-xl shadow-2xl overflow-hidden max-h-96 overflow-y-auto z-50 glow-violet">
          {searching && (
            <p className="px-4 py-6 text-sm text-zm-muted text-center">Đang tìm kiếm...</p>
          )}

          {!searching && !hasResults && (
            <p className="px-4 py-6 text-sm text-zm-muted text-center">
              Không tìm thấy kết quả nào cho "{query}"
            </p>
          )}

          {!searching && matchedPeople.length > 0 && (
            <div className="py-2">
              <p className="px-4 pb-1 text-[11px] font-bold uppercase tracking-wide text-zm-muted">
                Mọi người
              </p>
              {matchedPeople.map((p) => {
                const workLocation = [
                  p.work ? `Làm việc tại ${p.work}` : null,
                  p.location,
                ]
                  .filter(Boolean)
                  .join(" · ");
                const extra = [
                  p.mutualFriendsCount > 0 ? `${p.mutualFriendsCount} bạn chung` : null,
                  p.postCount > 0 ? `${p.postCount} bài viết` : null,
                ]
                  .filter(Boolean)
                  .join(" · ");
                return (
                  <Link
                    key={p.id}
                    to={`/profile/${p.id}`}
                    onClick={() => {
                      setOpen(false);
                      setQuery("");
                    }}
                    className="flex items-center gap-3 px-4 py-2 hover:bg-zm-hover transition-colors"
                  >
                    <Avatar src={p.avatar} alt="" className="w-9 h-9 shrink-0" />
                    <span className="min-w-0">
                      <span className="text-sm font-medium block truncate">{p.name}</span>
                      {workLocation && (
                        <span className="text-xs text-zm-muted block truncate">{workLocation}</span>
                      )}
                      {extra && <span className="text-xs text-zm-muted block truncate">{extra}</span>}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}

          {!searching && matchedPosts.length > 0 && (
            <div className="py-2 border-t border-zm-border">
              <p className="px-4 pb-1 text-[11px] font-bold uppercase tracking-wide text-zm-muted">
                Bài viết
              </p>
              {matchedPosts.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => goToPost(p.id)}
                  className="w-full flex items-start gap-3 px-4 py-2 hover:bg-zm-hover text-left transition-colors"
                >
                  <FaFileAlt className="text-zm-blue-light mt-0.5 shrink-0" size={13} aria-hidden="true" />
                  <span className="text-sm line-clamp-2">
                    <span className="font-semibold">{p.author.name}: </span>
                    {p.content}
                  </span>
                </button>
              ))}
            </div>
          )}

          {!searching && matchedTags.length > 0 && (
            <div className="py-2 border-t border-zm-border">
              <p className="px-4 pb-1 text-[11px] font-bold uppercase tracking-wide text-zm-muted">
                Xu hướng
              </p>
              {matchedTags.map((t) => (
                <div key={t.id} className="flex items-center gap-3 px-4 py-2">
                  <FaHashtag className="text-zm-orange shrink-0" size={13} aria-hidden="true" />
                  <span className="text-sm font-medium text-zm-blue-light">{t.tag}</span>
                </div>
              ))}
            </div>
          )}

          {!searching && hasResults && (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                navigate(`/search?q=${encodeURIComponent(q)}`);
              }}
              className="w-full min-h-11 flex items-center justify-center text-sm font-semibold text-zm-blue-light hover:bg-zm-hover border-t border-zm-border transition-colors"
            >
              Xem tất cả kết quả cho "{q}"
            </button>
          )}
        </div>
      )}
    </div>
  );
}
