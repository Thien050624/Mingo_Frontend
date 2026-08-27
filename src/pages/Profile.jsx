import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  FaCamera,
  FaUserPlus,
  FaUserFriends,
  FaCheck,
  FaCommentDots,
  FaEllipsisH,
  FaMapMarkerAlt,
  FaBriefcase,
  FaUserEdit,
  FaArrowLeft,
  FaVenusMars,
  FaTimes,
  FaBan,
} from "react-icons/fa";
import { useCurrentUser, toFrontendUser } from "../context/UserContext";
import { useChat } from "../context/ChatContext";
import { useToast } from "../context/ToastContext";
import * as postsApi from "../api/posts";
import * as usersApi from "../api/users";
import * as friendsApi from "../api/friends";
import { uploadImage } from "../api/uploads";
import PostComposer from "../components/feed/PostComposer";
import PostCard from "../components/feed/PostCard";
import Avatar from "../components/common/Avatar";
import AnchoredMenu from "../components/common/AnchoredMenu";
import ProfileSkeleton from "../components/common/ProfileSkeleton";
import { SlowLoadBanner } from "../components/common/LoadingIndicator";

const tabs = ["Bài viết", "Giới thiệu", "Bạn bè", "Hình ảnh"];
// Static (not interpolated) so Tailwind's JIT scanner can find these literal class names at build time.
const TAB_INDICATOR_TRANSLATE = ["translate-x-0", "translate-x-[100%]", "translate-x-[200%]", "translate-x-[300%]"];

export default function Profile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { currentUser, updateProfile } = useCurrentUser();
  const { conversations, openDirectConversation } = useChat();

  const [activeTab, setActiveTab] = useState("Bài viết");
  const [loading, setLoading] = useState(true);
  const [profileUser, setProfileUser] = useState(null);
  const [friendshipStatus, setFriendshipStatus] = useState("NONE");
  const [friendsList, setFriendsList] = useState([]);
  const [posts, setPosts] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [blockedByMe, setBlockedByMe] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [confirmingBlock, setConfirmingBlock] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const optionsButtonRef = useRef(null);
  const avatarInputRef = useRef(null);
  const { showToast } = useToast();

  const isOwn = profileUser?.id === currentUser.id;

  useEffect(() => {
    let cancelled = false;
    setActiveTab("Bài viết");
    setLoading(true);

    const isOwnProfile = !userId || userId === currentUser.id;
    const loadUser = isOwnProfile ? Promise.resolve(currentUser) : usersApi.getById(userId).then(toFrontendUser);

    loadUser
      .then((user) => {
        if (cancelled) return null;
        setProfileUser(user);
        return Promise.all([
          postsApi.getPostsByUser(user.id).then((page) => page.content.map(postsApi.toFrontendPost)),
          friendsApi.listFriends(user.id).then((list) => list.map(friendsApi.toFrontendPerson)),
          isOwnProfile ? Promise.resolve({ status: "SELF", blockedByMe: false }) : friendsApi.getStatus(user.id),
        ]);
      })
      .then((result) => {
        if (cancelled || !result) return;
        const [postsList, friends, statusRes] = result;
        setPosts(postsList);
        setFriendsList(friends);
        setFriendshipStatus(statusRes.status);
        setBlockedByMe(statusRes.blockedByMe);
      })
      .catch(() => {
        if (!cancelled) setProfileUser(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId, currentUser.id]);

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploadingAvatar(true);
    try {
      const url = await uploadImage(file);
      await updateProfile({ avatar: url });
      setProfileUser((prev) => (prev ? { ...prev, avatar: url } : prev));
    } catch (err) {
      showToast(err.message || "Không thể đổi ảnh đại diện", "error");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const messageUser = async () => {
    const existing = conversations.find((c) => !c.group && c.user.id === profileUser.id);
    if (existing) {
      navigate("/chat", { state: { activeConversationId: existing.id } });
      return;
    }
    try {
      const conversationId = await openDirectConversation(profileUser.id);
      navigate("/chat", { state: { activeConversationId: conversationId } });
    } catch (err) {
      console.error("Không thể mở cuộc trò chuyện:", err);
    }
  };

  const addPost = async ({ text, images, visibility }) => {
    const created = await postsApi.createPost({ content: text, images, visibility });
    setPosts((prev) => [postsApi.toFrontendPost(created), ...prev]);
  };

  const updatePostInList = (updated) => {
    setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const removePostFromList = (postId) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  const withFriendAction = async (apiCall) => {
    setActionLoading(true);
    try {
      const res = await apiCall();
      setFriendshipStatus(res.status);
      const friends = await friendsApi.listFriends(profileUser.id);
      setFriendsList(friends.map(friendsApi.toFrontendPerson));
    } catch (err) {
      console.error("Không thể cập nhật trạng thái kết bạn:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const sendFriendRequest = () => withFriendAction(() => friendsApi.sendRequest(profileUser.id));
  const acceptFriendRequest = () => withFriendAction(() => friendsApi.acceptRequest(profileUser.id));
  const removeFriendRelation = () => withFriendAction(() => friendsApi.removeRelationship(profileUser.id));

  const blockUser = async () => {
    setActionLoading(true);
    try {
      await friendsApi.blockUser(profileUser.id);
      setBlockedByMe(true);
      setFriendshipStatus("NONE");
      setShowOptionsMenu(false);
      setConfirmingBlock(false);
      showToast(`Đã chặn ${profileUser.name}`);
    } catch (err) {
      showToast(err.message || "Không thể chặn người dùng này", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const unblockUser = async () => {
    setActionLoading(true);
    try {
      await friendsApi.unblockUser(profileUser.id);
      setBlockedByMe(false);
      setShowOptionsMenu(false);
      showToast(`Đã bỏ chặn ${profileUser.name}`);
    } catch (err) {
      showToast(err.message || "Không thể bỏ chặn người dùng này", "error");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <SlowLoadBanner className="mb-3" />
        <ProfileSkeleton />
      </>
    );
  }

  if (!profileUser) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <p className="text-lg font-semibold mb-2">Không tìm thấy người dùng này</p>
        <p className="text-sm text-zm-muted mb-4">
          Tài khoản có thể đã bị xoá hoặc đường dẫn không chính xác.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-zm-blue-light hover:underline"
        >
          <FaArrowLeft size={12} aria-hidden="true" /> Về trang chủ
        </Link>
      </div>
    );
  }

  const activeTabIndex = tabs.indexOf(activeTab);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="relative bg-zm-card rounded-2xl border border-zm-border overflow-hidden mb-4 glow-violet">
        <div className="absolute -top-16 -right-10 w-64 h-64 rounded-full bg-zm-blue-light/15 blur-3xl pointer-events-none animate-aurora-a" />
        <div className="absolute -bottom-20 -left-16 w-72 h-72 rounded-full bg-zm-blue/15 blur-3xl pointer-events-none animate-aurora-b" />

        {isOwn && (
          <button
            type="button"
            onClick={() => navigate("/settings/profile")}
            aria-label="Chỉnh sửa trang cá nhân"
            title="Chỉnh sửa trang cá nhân"
            className="absolute top-3 right-3 z-10 w-11 h-11 flex items-center justify-center bg-zm-bg hover:bg-zm-hover border border-zm-border rounded-full transition-colors"
          >
            <FaUserEdit size={14} aria-hidden="true" />
          </button>
        )}

        <div className="relative px-4 sm:px-8 pt-8 pb-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="relative shrink-0 mx-auto sm:mx-0">
              <div className="p-1 rounded-full bg-gradient-to-br from-zm-blue to-zm-blue-light">
                <Avatar
                  src={profileUser.avatar}
                  alt={`Ảnh đại diện của ${profileUser.name}`}
                  className="w-28 h-28 sm:w-32 sm:h-32 ring-4 ring-zm-card bg-zm-card"
                />
              </div>
              {isOwn && (
                <>
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    aria-label="Đổi ảnh đại diện"
                    className="absolute bottom-1 right-1 w-11 h-11 flex items-center justify-center bg-zm-bg hover:bg-zm-hover disabled:opacity-60 rounded-full ring-2 ring-zm-card"
                  >
                    <FaCamera size={13} aria-hidden="true" />
                  </button>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    hidden
                    aria-label="Chọn ảnh đại diện"
                    onChange={handleAvatarChange}
                  />
                </>
              )}
            </div>

            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-extrabold glow-text">{profileUser.name}</h1>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2.5">
                <span className="flex items-center gap-1.5 text-xs font-semibold bg-zm-blue/10 text-zm-blue-light px-3 py-1 rounded-full">
                  <FaUserFriends size={11} aria-hidden="true" /> {friendsList.length} bạn bè
                </span>
                <span className="flex items-center gap-1.5 text-xs font-semibold bg-zm-blue/10 text-zm-blue-light px-3 py-1 rounded-full">
                  {posts.length} bài viết
                </span>
                {profileUser.work && (
                  <span className="flex items-center gap-1.5 text-xs text-zm-muted bg-zm-bg border border-zm-border px-3 py-1 rounded-full">
                    <FaBriefcase size={10} aria-hidden="true" /> {profileUser.work}
                  </span>
                )}
                {profileUser.location && (
                  <span className="flex items-center gap-1.5 text-xs text-zm-muted bg-zm-bg border border-zm-border px-3 py-1 rounded-full">
                    <FaMapMarkerAlt size={10} aria-hidden="true" /> {profileUser.location}
                  </span>
                )}
              </div>
              {profileUser.bio && (
                <p className="text-sm text-zm-muted mt-3 max-w-xl">{profileUser.bio}</p>
              )}
            </div>

            <div className="flex items-center justify-center gap-2 shrink-0">
              {!isOwn && (
                <>
                  {friendshipStatus === "FRIENDS" && (
                    <button
                      type="button"
                      onClick={removeFriendRelation}
                      disabled={actionLoading}
                      className="flex items-center gap-2 bg-zm-bg text-zm-text hover:bg-zm-hover border border-zm-border font-semibold text-sm px-4 py-2 rounded-lg transition-colors disabled:opacity-60"
                    >
                      <FaCheck size={12} aria-hidden="true" /> Bạn bè
                    </button>
                  )}
                  {friendshipStatus === "PENDING_SENT" && (
                    <button
                      type="button"
                      onClick={removeFriendRelation}
                      disabled={actionLoading}
                      className="flex items-center gap-2 bg-zm-bg text-zm-text hover:bg-zm-hover border border-zm-border font-semibold text-sm px-4 py-2 rounded-lg transition-colors disabled:opacity-60"
                    >
                      <FaTimes size={12} aria-hidden="true" /> Huỷ lời mời
                    </button>
                  )}
                  {friendshipStatus === "PENDING_RECEIVED" && (
                    <>
                      <button
                        type="button"
                        onClick={acceptFriendRequest}
                        disabled={actionLoading}
                        className="flex items-center gap-2 bg-gradient-to-r from-zm-blue to-zm-blue-light text-white font-semibold text-sm px-4 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-60"
                      >
                        <FaCheck size={12} aria-hidden="true" /> Chấp nhận
                      </button>
                      <button
                        type="button"
                        onClick={removeFriendRelation}
                        disabled={actionLoading}
                        className="flex items-center gap-2 bg-zm-bg text-zm-text hover:bg-zm-hover border border-zm-border font-semibold text-sm px-4 py-2 rounded-lg transition-colors disabled:opacity-60"
                      >
                        Từ chối
                      </button>
                    </>
                  )}
                  {friendshipStatus === "NONE" && (
                    <button
                      type="button"
                      onClick={sendFriendRequest}
                      disabled={actionLoading}
                      className="flex items-center gap-2 bg-gradient-to-r from-zm-blue to-zm-blue-light text-white font-semibold text-sm px-4 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-60"
                    >
                      <FaUserPlus size={12} aria-hidden="true" /> Kết bạn
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={messageUser}
                    className="flex items-center gap-2 bg-zm-bg hover:bg-zm-hover border border-zm-border font-semibold text-sm px-4 py-2 rounded-lg"
                  >
                    <FaCommentDots size={13} aria-hidden="true" /> Nhắn tin
                  </button>
                </>
              )}
              {!isOwn && (
                <div className="relative">
                  <button
                    ref={optionsButtonRef}
                    type="button"
                    onClick={() => setShowOptionsMenu((v) => !v)}
                    aria-label="Tùy chọn trang cá nhân"
                    aria-haspopup="true"
                    aria-expanded={showOptionsMenu}
                    className="bg-zm-bg hover:bg-zm-hover border border-zm-border w-11 h-11 flex items-center justify-center rounded-lg"
                  >
                    <FaEllipsisH size={14} aria-hidden="true" />
                  </button>
                  <AnchoredMenu
                    anchorRef={optionsButtonRef}
                    open={showOptionsMenu}
                    onClose={() => {
                      setShowOptionsMenu(false);
                      setConfirmingBlock(false);
                    }}
                    align="right"
                    className="w-64 bg-zm-card border border-zm-border rounded-xl shadow-2xl py-1.5 z-50 glow-violet"
                  >
                    {!confirmingBlock ? (
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => (blockedByMe ? unblockUser() : setConfirmingBlock(true))}
                        disabled={actionLoading}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-zm-hover transition-colors disabled:opacity-60"
                      >
                        <FaBan className={blockedByMe ? "text-zm-muted" : "text-zm-heart"} size={13} aria-hidden="true" />
                        {blockedByMe ? `Bỏ chặn ${profileUser.name}` : `Chặn ${profileUser.name}`}
                      </button>
                    ) : (
                      <div className="p-3">
                        <p className="text-sm mb-3">
                          Chặn {profileUser.name}? Hai bạn sẽ không thể xem trang cá nhân, kết bạn hay nhắn tin với nhau nữa.
                        </p>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setConfirmingBlock(false)}
                            className="flex-1 text-sm font-semibold rounded-lg py-1.5 border border-zm-border hover:bg-zm-hover transition-colors"
                          >
                            Huỷ
                          </button>
                          <button
                            type="button"
                            onClick={blockUser}
                            disabled={actionLoading}
                            className="flex-1 text-sm font-semibold rounded-lg py-1.5 bg-zm-heart text-white hover:opacity-90 disabled:opacity-60 transition-opacity"
                          >
                            Chặn
                          </button>
                        </div>
                      </div>
                    )}
                  </AnchoredMenu>
                </div>
              )}
            </div>
          </div>

          {friendsList.length > 0 && (
            <div className="flex items-center gap-2.5 mt-5 pt-4 border-t border-zm-border/60 overflow-x-auto">
              <span className="text-xs font-semibold text-zm-muted shrink-0">Bạn bè</span>
              {friendsList.slice(0, 8).map((f) => (
                <Link key={f.id} to={`/profile/${f.id}`} className="shrink-0" title={f.name}>
                  <Avatar
                    src={f.avatar}
                    alt={`Ảnh đại diện của ${f.name}`}
                    className="w-9 h-9 ring-2 ring-zm-card hover:ring-zm-blue transition-all"
                  />
                </Link>
              ))}
              <button
                type="button"
                onClick={() => setActiveTab("Bạn bè")}
                className="text-xs font-semibold text-zm-blue-light shrink-0 ml-1 hover:underline"
              >
                Xem tất cả
              </button>
            </div>
          )}

          <div className="relative flex mt-5 bg-zm-bg border border-zm-border rounded-full p-1 max-w-md mx-auto sm:mx-0">
            <div
              aria-hidden="true"
              className={`absolute inset-y-1 w-[calc((100%-0.5rem)/4)] rounded-full bg-gradient-to-r from-zm-blue to-zm-blue-light ${TAB_INDICATOR_TRANSLATE[activeTabIndex]}`}
            />
            {tabs.map((t) => (
              <button
                key={t}
                type="button"
                aria-current={activeTab === t}
                onClick={() => setActiveTab(t)}
                className={`relative z-10 flex-1 min-h-11 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap ${
                  activeTab === t ? "text-white" : "text-zm-muted"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        {activeTab === "Bài viết" && (
          <>
            {isOwn && <PostComposer onPost={addPost} />}
            {posts.length === 0 ? (
              <div className="bg-zm-card rounded-2xl border border-zm-border p-8 text-center text-zm-muted text-sm">
                Chưa có bài viết nào.
              </div>
            ) : (
              posts.map((p) => (
                <PostCard key={p.id} post={p} onUpdated={updatePostInList} onDeleted={removePostFromList} />
              ))
            )}
          </>
        )}

        {activeTab === "Giới thiệu" && (
          <div className="bg-zm-card rounded-2xl border border-zm-border p-5">
            <h3 className="font-bold mb-3">Giới thiệu</h3>
            <ul className="flex flex-col gap-3 text-sm">
              <li className="flex items-center gap-2.5">
                <FaBriefcase className="text-zm-muted shrink-0" aria-hidden="true" /> {profileUser.work || "Chưa cập nhật"}
              </li>
              <li className="flex items-center gap-2.5">
                <FaMapMarkerAlt className="text-zm-muted shrink-0" aria-hidden="true" /> Sống tại{" "}
                {profileUser.location || "chưa cập nhật"}
              </li>
              {profileUser.gender && (
                <li className="flex items-center gap-2.5">
                  <FaVenusMars className="text-zm-muted shrink-0" aria-hidden="true" /> {profileUser.gender}
                </li>
              )}
            </ul>
          </div>
        )}

        {activeTab === "Bạn bè" && (
          <div className="bg-zm-card rounded-2xl border border-zm-border p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold">Bạn bè</h3>
              <span className="text-xs text-zm-blue-light font-semibold">{friendsList.length} bạn bè</span>
            </div>
            {friendsList.length === 0 ? (
              <p className="text-xs text-zm-muted">Chưa có bạn bè nào.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {friendsList.map((p) => (
                  <Link key={p.id} to={`/profile/${p.id}`} className="group">
                    <img
                      src={p.avatar}
                      alt={`Ảnh đại diện của ${p.name}`}
                      className="w-full aspect-square object-cover rounded-xl group-hover:opacity-80 transition-opacity"
                    />
                    <p className="text-sm font-medium mt-1.5 truncate">{p.name}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "Hình ảnh" && (
          <div className="bg-zm-card rounded-2xl border border-zm-border p-8 text-center text-zm-muted text-sm">
            Nội dung "Hình ảnh" đang được cập nhật.
          </div>
        )}
      </div>
    </div>
  );
}
