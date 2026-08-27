import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { FaUserPlus, FaCheck, FaSearch } from "react-icons/fa";
import * as usersApi from "../api/users";
import * as postsApi from "../api/posts";
import * as friendsApi from "../api/friends";
import Avatar from "../components/common/Avatar";
import PostCard from "../components/feed/PostCard";

const PAGE_SIZE = 10;

function FriendActionButton({ status, onSendRequest }) {
  if (status === "FRIENDS") {
    return (
      <span className="shrink-0 min-h-11 flex items-center gap-1.5 text-xs font-semibold text-zm-muted px-3.5">
        <FaCheck size={11} aria-hidden="true" /> Bạn bè
      </span>
    );
  }
  if (status === "PENDING_SENT") {
    return (
      <span className="shrink-0 min-h-11 flex items-center text-xs font-semibold text-zm-muted px-3.5">
        Đã gửi lời mời
      </span>
    );
  }
  if (status === "PENDING_RECEIVED") {
    return (
      <Link
        to="/friends"
        className="shrink-0 min-h-11 flex items-center text-xs font-semibold text-zm-blue-light hover:underline px-3.5"
      >
        Xem lời mời
      </Link>
    );
  }
  return (
    <button
      type="button"
      onClick={onSendRequest}
      className="shrink-0 min-h-11 flex items-center gap-1.5 bg-zm-hover hover:bg-zm-border text-zm-blue-light text-xs font-semibold rounded-full px-3.5"
    >
      <FaUserPlus size={11} aria-hidden="true" /> Kết bạn
    </button>
  );
}

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const q = (searchParams.get("q") || "").trim();

  const [users, setUsers] = useState([]);
  const [usersPage, setUsersPage] = useState(0);
  const [usersHasMore, setUsersHasMore] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [friendStatus, setFriendStatus] = useState({});

  const [posts, setPosts] = useState([]);
  const [postsPage, setPostsPage] = useState(0);
  const [postsHasMore, setPostsHasMore] = useState(false);
  const [loadingPosts, setLoadingPosts] = useState(true);

  useEffect(() => {
    if (!q) {
      setUsers([]);
      setPosts([]);
      setLoadingUsers(false);
      setLoadingPosts(false);
      return;
    }
    setLoadingUsers(true);
    setLoadingPosts(true);
    setUsersPage(0);
    setPostsPage(0);

    usersApi
      .searchUsers(q, 0, PAGE_SIZE)
      .then((res) => {
        setUsers(res.content);
        setUsersHasMore(!res.last);
      })
      .finally(() => setLoadingUsers(false));

    postsApi
      .searchPosts(q, 0, PAGE_SIZE)
      .then((res) => {
        setPosts(res.content.map(postsApi.toFrontendPost));
        setPostsHasMore(!res.last);
      })
      .finally(() => setLoadingPosts(false));
  }, [q]);

  useEffect(() => {
    if (users.length === 0) return;
    Promise.all(
      users.map((u) =>
        friendsApi
          .getStatus(u.id)
          .then((res) => [u.id, res.status])
          .catch(() => [u.id, "NONE"])
      )
    ).then((pairs) => {
      setFriendStatus((prev) => ({ ...prev, ...Object.fromEntries(pairs) }));
    });
  }, [users]);

  const loadMoreUsers = () => {
    const nextPage = usersPage + 1;
    usersApi.searchUsers(q, nextPage, PAGE_SIZE).then((res) => {
      setUsers((prev) => [...prev, ...res.content]);
      setUsersPage(nextPage);
      setUsersHasMore(!res.last);
    });
  };

  const loadMorePosts = () => {
    const nextPage = postsPage + 1;
    postsApi.searchPosts(q, nextPage, PAGE_SIZE).then((res) => {
      setPosts((prev) => [...prev, ...res.content.map(postsApi.toFrontendPost)]);
      setPostsPage(nextPage);
      setPostsHasMore(!res.last);
    });
  };

  const sendRequest = async (userId) => {
    setFriendStatus((prev) => ({ ...prev, [userId]: "PENDING_SENT" }));
    try {
      await friendsApi.sendRequest(userId);
    } catch (err) {
      setFriendStatus((prev) => ({ ...prev, [userId]: "NONE" }));
    }
  };

  const updatePostInList = (updated) => {
    setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const removePostFromList = (postId) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  if (!q) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-zm-card rounded-2xl border border-zm-border p-10 text-center text-zm-muted">
          <FaSearch className="mx-auto mb-3" size={26} aria-hidden="true" />
          Nhập từ khoá ở ô tìm kiếm phía trên để bắt đầu.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-lg font-bold mb-4">Kết quả tìm kiếm cho "{q}"</h1>

      <div className="bg-zm-card rounded-2xl border border-zm-border p-4 mb-5">
        <h2 className="font-bold text-sm text-zm-muted uppercase tracking-wide mb-2">Người dùng</h2>
        {loadingUsers ? (
          <p className="py-6 text-center text-sm text-zm-muted">Đang tải...</p>
        ) : users.length === 0 ? (
          <p className="py-6 text-center text-sm text-zm-muted">Không tìm thấy người dùng nào.</p>
        ) : (
          <>
            <div className="flex flex-col divide-y divide-zm-border">
              {users.map((u) => {
                const workLocation = [u.work ? `Làm việc tại ${u.work}` : null, u.location]
                  .filter(Boolean)
                  .join(" · ");
                const extra = [
                  u.mutualFriendsCount > 0 ? `${u.mutualFriendsCount} bạn chung` : null,
                  u.postCount > 0 ? `${u.postCount} bài viết` : null,
                ]
                  .filter(Boolean)
                  .join(" · ");
                return (
                  <div key={u.id} className="flex items-center gap-3 py-3">
                    <Link to={`/profile/${u.id}`} className="shrink-0">
                      <Avatar src={u.avatar} alt={`Ảnh đại diện của ${u.name}`} className="w-12 h-12" />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link to={`/profile/${u.id}`} className="font-semibold text-sm hover:text-zm-blue-light block truncate">
                        {u.name}
                      </Link>
                      {workLocation && <p className="text-xs text-zm-muted truncate">{workLocation}</p>}
                      {extra && <p className="text-xs text-zm-muted truncate">{extra}</p>}
                    </div>
                    <FriendActionButton
                      status={friendStatus[u.id]}
                      onSendRequest={() => sendRequest(u.id)}
                    />
                  </div>
                );
              })}
            </div>
            {usersHasMore && (
              <button
                type="button"
                onClick={loadMoreUsers}
                className="w-full min-h-11 mt-2 text-sm font-semibold text-zm-blue-light hover:bg-zm-hover rounded-lg transition-colors"
              >
                Tải thêm người dùng
              </button>
            )}
          </>
        )}
      </div>

      <div>
        <h2 className="font-bold text-sm text-zm-muted uppercase tracking-wide mb-2 px-1">Bài viết</h2>
        {loadingPosts ? (
          <div className="bg-zm-card rounded-2xl border border-zm-border p-6 text-center text-sm text-zm-muted">
            Đang tải...
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-zm-card rounded-2xl border border-zm-border p-6 text-center text-sm text-zm-muted">
            Không tìm thấy bài viết nào.
          </div>
        ) : (
          <>
            {posts.map((p) => (
              <PostCard key={p.id} post={p} onUpdated={updatePostInList} onDeleted={removePostFromList} />
            ))}
            {postsHasMore && (
              <button
                type="button"
                onClick={loadMorePosts}
                className="w-full min-h-11 text-sm font-semibold text-zm-blue-light hover:bg-zm-hover rounded-lg transition-colors"
              >
                Tải thêm bài viết
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
