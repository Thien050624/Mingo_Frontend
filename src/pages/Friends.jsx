import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FaUserPlus, FaCheck, FaTimes, FaUserFriends, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import * as friendsApi from "../api/friends";
import Avatar from "../components/common/Avatar";
import LoadingIndicator from "../components/common/LoadingIndicator";

function AvatarRing({ src, alt, size = 44 }) {
  return (
    <div
      className="shrink-0 rounded-full p-[2px] bg-gradient-to-br from-zm-blue to-zm-blue-light"
      style={{ width: size, height: size }}
    >
      <Avatar src={src} alt={alt} className="w-full h-full ring-2 ring-zm-card" />
    </div>
  );
}

export default function Friends() {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [added, setAdded] = useState([]);
  const carouselRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([friendsApi.listIncomingRequests(), friendsApi.listSuggestions()])
      .then(([reqs, suggs]) => {
        if (cancelled) return;
        setRequests(reqs);
        setSuggestions(suggs);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const accept = async (req) => {
    try {
      await friendsApi.acceptRequest(req.from.id);
      setRequests((prev) => prev.filter((r) => r.friendshipId !== req.friendshipId));
    } catch (err) {
      console.error("Không thể chấp nhận lời mời:", err);
    }
  };

  const decline = async (req) => {
    try {
      await friendsApi.removeRelationship(req.from.id);
      setRequests((prev) => prev.filter((r) => r.friendshipId !== req.friendshipId));
    } catch (err) {
      console.error("Không thể xoá lời mời:", err);
    }
  };

  const sendRequest = async (userId) => {
    try {
      await friendsApi.sendRequest(userId);
      setAdded((prev) => [...prev, userId]);
    } catch (err) {
      console.error("Không thể gửi lời mời kết bạn:", err);
    }
  };

  const scrollCarousel = (direction) => {
    carouselRef.current?.scrollBy({ left: direction * 300, behavior: "smooth" });
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-zm-card rounded-2xl border border-zm-border p-8">
          <LoadingIndicator />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-zm-card rounded-2xl border border-zm-border p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h1 className="font-bold text-lg">Lời mời kết bạn</h1>
          {requests.length > 0 && (
            <span className="text-xs text-zm-muted bg-zm-hover px-2.5 py-0.5 rounded-full">{requests.length}</span>
          )}
        </div>
        {requests.length === 0 ? (
          <div className="py-8 text-center">
            <FaUserFriends className="mx-auto text-zm-muted mb-3" size={26} aria-hidden="true" />
            <p className="font-semibold mb-1">Không có lời mời kết bạn nào</p>
            <p className="text-sm text-zm-muted">Khi có ai đó gửi lời mời, nó sẽ xuất hiện ở đây.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {requests.map((req) => (
              <div key={req.friendshipId} className="flex items-center gap-3 py-2 px-1 rounded-xl hover:bg-zm-hover">
                <Link to={`/profile/${req.from.id}`} className="shrink-0">
                  <AvatarRing src={req.from.avatar} alt={`Ảnh đại diện của ${req.from.name}`} />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/profile/${req.from.id}`}
                    className="block text-sm font-medium truncate hover:text-zm-blue-light"
                  >
                    {req.from.name}
                  </Link>
                  <p className="text-xs text-zm-muted">Đã gửi lời mời kết bạn</p>
                </div>
                <button
                  type="button"
                  onClick={() => accept(req)}
                  className="shrink-0 min-h-11 flex items-center gap-1.5 bg-gradient-to-r from-zm-blue to-zm-blue-light hover:opacity-90 text-white text-xs font-semibold rounded-full px-3.5"
                >
                  <FaCheck size={11} aria-hidden="true" /> Xác nhận
                </button>
                <button
                  type="button"
                  onClick={() => decline(req)}
                  aria-label={`Xoá lời mời từ ${req.from.name}`}
                  className="shrink-0 min-w-11 min-h-11 border border-zm-border text-zm-muted hover:bg-zm-hover rounded-full flex items-center justify-center"
                >
                  <FaTimes size={11} aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-zm-card rounded-2xl border border-zm-border p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-lg">Gợi ý kết bạn</h2>
          {suggestions.length > 0 && (
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => scrollCarousel(-1)}
                aria-label="Cuộn trái"
                className="w-11 h-11 rounded-full border border-zm-border text-zm-muted hover:bg-zm-hover flex items-center justify-center"
              >
                <FaChevronLeft size={11} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => scrollCarousel(1)}
                aria-label="Cuộn phải"
                className="w-11 h-11 rounded-full border border-zm-border text-zm-muted hover:bg-zm-hover flex items-center justify-center"
              >
                <FaChevronRight size={11} aria-hidden="true" />
              </button>
            </div>
          )}
        </div>
        {suggestions.length === 0 ? (
          <p className="text-sm text-zm-muted text-center py-8">Chưa có gợi ý kết bạn nào.</p>
        ) : (
          <div ref={carouselRef} className="flex gap-3 overflow-x-auto pb-1 scroll-smooth">
            {suggestions.map(({ user, mutualCount }) => (
              <div
                key={user.id}
                className="shrink-0 w-32 bg-zm-bg border border-zm-border rounded-2xl p-3.5 text-center"
              >
                <Link to={`/profile/${user.id}`} className="block mx-auto w-fit mb-2">
                  <AvatarRing src={user.avatar} alt={`Ảnh đại diện của ${user.name}`} size={56} />
                </Link>
                <Link
                  to={`/profile/${user.id}`}
                  className="block text-sm font-medium truncate hover:text-zm-blue-light"
                >
                  {user.name}
                </Link>
                <p className="text-xs text-zm-muted mb-2.5 truncate">
                  {mutualCount > 0 ? `${mutualCount} bạn chung` : "Không có bạn chung"}
                </p>
                <button
                  type="button"
                  disabled={added.includes(user.id)}
                  onClick={() => sendRequest(user.id)}
                  className="w-full min-h-11 flex items-center justify-center gap-1.5 bg-zm-hover hover:bg-zm-border disabled:text-zm-muted text-zm-blue-light text-xs font-semibold rounded-full"
                >
                  {added.includes(user.id) ? (
                    "Đã gửi"
                  ) : (
                    <>
                      <FaUserPlus size={11} aria-hidden="true" /> Kết bạn
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
