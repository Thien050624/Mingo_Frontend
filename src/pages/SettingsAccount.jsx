import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaCheck, FaLock, FaBell, FaExclamationTriangle, FaBan, FaUserSlash } from "react-icons/fa";
import { useCurrentUser } from "../context/UserContext";
import { useToast } from "../context/ToastContext";
import * as friendsApi from "../api/friends";
import Avatar from "../components/common/Avatar";

export default function SettingsAccount() {
  const { currentUser, changeEmail, changePassword, deleteAccount } = useCurrentUser();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [blockedUsers, setBlockedUsers] = useState([]);
  const [blockedLoading, setBlockedLoading] = useState(true);

  useEffect(() => {
    friendsApi
      .listBlockedUsers()
      .then(setBlockedUsers)
      .catch(() => {})
      .finally(() => setBlockedLoading(false));
  }, []);

  const unblockUser = async (user) => {
    try {
      await friendsApi.unblockUser(user.id);
      setBlockedUsers((prev) => prev.filter((u) => u.id !== user.id));
      showToast(`Đã bỏ chặn ${user.name}`);
    } catch (err) {
      showToast(err.message || "Không thể bỏ chặn người dùng này", "error");
    }
  };

  const [email, setEmail] = useState(currentUser.email);
  const [emailPassword, setEmailPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailSaved, setEmailSaved] = useState(false);

  const [passwords, setPasswords] = useState({ current: "", next: "", confirm: "" });
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);

  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyPush, setNotifyPush] = useState(true);

  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirming, setDeleteConfirming] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);

  const submitEmail = async (e) => {
    e.preventDefault();
    setEmailError("");
    setEmailSaved(false);
    if (email.trim() === currentUser.email) return;
    if (!emailPassword) {
      setEmailError("Vui lòng nhập mật khẩu hiện tại để xác nhận.");
      return;
    }
    setEmailSaving(true);
    try {
      await changeEmail(email.trim(), emailPassword);
      setEmailPassword("");
      setEmailSaved(true);
      showToast("Đã cập nhật email");
    } catch (err) {
      setEmailError(err.message || "Không thể cập nhật email");
    } finally {
      setEmailSaving(false);
    }
  };

  const submitPassword = async (e) => {
    e.preventDefault();
    setPasswordError(false);
    if (!passwords.current || !passwords.next) {
      setPasswordMessage("Vui lòng nhập đầy đủ thông tin.");
      setPasswordError(true);
      return;
    }
    if (passwords.next.length < 8) {
      setPasswordMessage("Mật khẩu mới phải có ít nhất 8 ký tự.");
      setPasswordError(true);
      return;
    }
    if (passwords.next !== passwords.confirm) {
      setPasswordMessage("Mật khẩu xác nhận không khớp.");
      setPasswordError(true);
      return;
    }
    setPasswordSaving(true);
    try {
      await changePassword(passwords.current, passwords.next);
      setPasswords({ current: "", next: "", confirm: "" });
      setPasswordMessage("Đã đổi mật khẩu thành công.");
      showToast("Đã đổi mật khẩu thành công");
    } catch (err) {
      setPasswordMessage(err.message || "Không thể đổi mật khẩu");
      setPasswordError(true);
    } finally {
      setPasswordSaving(false);
    }
  };

  const submitDelete = async (e) => {
    e.preventDefault();
    setDeleteError("");
    if (!deletePassword) {
      setDeleteError("Vui lòng nhập mật khẩu để xác nhận.");
      return;
    }
    setDeleting(true);
    try {
      await deleteAccount(deletePassword);
      navigate("/login");
    } catch (err) {
      setDeleteError(err.message || "Không thể xoá tài khoản");
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        to="/settings"
        className="inline-flex items-center gap-2 text-sm font-semibold text-zm-muted hover:text-zm-blue-light mb-4 transition-colors"
      >
        <FaArrowLeft size={12} aria-hidden="true" /> Về Cài đặt
      </Link>

      <div className="relative overflow-hidden rounded-2xl border border-zm-border bg-gradient-to-br from-zm-blue/25 via-zm-card to-zm-card p-5 mb-5">
        <div className="absolute -top-16 -right-10 w-52 h-52 rounded-full bg-zm-blue-light/20 blur-3xl pointer-events-none" />
        <h1 className="relative text-2xl font-extrabold">
          Cài đặt <span className="glow-text">tài khoản</span>
        </h1>
        <p className="relative text-sm text-zm-muted mt-1">
          Email, mật khẩu, ngôn ngữ và thông báo
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <form onSubmit={submitEmail} className="bg-zm-card rounded-2xl border border-zm-border p-5">
          <h2 className="font-bold text-base mb-3">Email</h2>
          <div className="flex flex-col gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailSaved(false);
                setEmailError("");
              }}
              required
              aria-label="Email"
              className="bg-zm-bg border border-zm-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-zm-blue"
            />
            <input
              type="password"
              value={emailPassword}
              onChange={(e) => {
                setEmailPassword(e.target.value);
                setEmailError("");
              }}
              placeholder="Mật khẩu hiện tại để xác nhận"
              aria-label="Mật khẩu hiện tại để xác nhận đổi email"
              className="bg-zm-bg border border-zm-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-zm-blue placeholder-zm-muted"
            />
            <button
              type="submit"
              disabled={emailSaving}
              className="self-start bg-gradient-to-r from-zm-blue to-zm-blue-light hover:opacity-90 disabled:opacity-60 text-white font-semibold text-sm px-5 py-2.5 rounded-lg transition-opacity"
            >
              {emailSaving ? "Đang cập nhật..." : "Cập nhật"}
            </button>
          </div>
          {emailError && <p className="text-sm text-zm-heart font-medium mt-2">{emailError}</p>}
          {emailSaved && (
            <span className="flex items-center gap-1.5 text-sm text-emerald-400 font-medium mt-2">
              <FaCheck size={12} aria-hidden="true" /> Đã cập nhật email
            </span>
          )}
        </form>

        <form onSubmit={submitPassword} className="bg-zm-card rounded-2xl border border-zm-border p-5">
          <h2 className="font-bold text-base mb-3 flex items-center gap-2">
            <FaLock size={14} className="text-zm-muted" aria-hidden="true" /> Đổi mật khẩu
          </h2>
          <div className="flex flex-col gap-3">
            <input
              type="password"
              value={passwords.current}
              onChange={(e) => setPasswords((p) => ({ ...p, current: e.target.value }))}
              placeholder="Mật khẩu hiện tại"
              aria-label="Mật khẩu hiện tại"
              className="bg-zm-bg border border-zm-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-zm-blue placeholder-zm-muted"
            />
            <div className="grid sm:grid-cols-2 gap-3">
              <input
                type="password"
                value={passwords.next}
                onChange={(e) => setPasswords((p) => ({ ...p, next: e.target.value }))}
                placeholder="Mật khẩu mới"
                aria-label="Mật khẩu mới"
                className="bg-zm-bg border border-zm-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-zm-blue placeholder-zm-muted"
              />
              <input
                type="password"
                value={passwords.confirm}
                onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))}
                placeholder="Xác nhận mật khẩu mới"
                aria-label="Xác nhận mật khẩu mới"
                className="bg-zm-bg border border-zm-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-zm-blue placeholder-zm-muted"
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={passwordSaving}
                className="bg-gradient-to-r from-zm-blue to-zm-blue-light hover:opacity-90 disabled:opacity-60 text-white font-semibold text-sm px-5 py-2.5 rounded-lg transition-opacity"
              >
                {passwordSaving ? "Đang xử lý..." : "Đổi mật khẩu"}
              </button>
              {passwordMessage && (
                <span className={`text-sm ${passwordError ? "text-zm-heart" : "text-zm-muted"}`}>
                  {passwordMessage}
                </span>
              )}
            </div>
          </div>
        </form>

        <div className="bg-zm-card rounded-2xl border border-zm-border p-5">
          <h2 className="font-bold text-base mb-3 flex items-center gap-2">
            <FaBell size={14} className="text-zm-muted" aria-hidden="true" /> Thông báo
          </h2>
          <div className="flex flex-col gap-3">
            <label className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">Thông báo qua email</p>
                <p className="text-xs text-zm-muted">Nhận email khi có hoạt động mới</p>
              </div>
              <input
                type="checkbox"
                checked={notifyEmail}
                onChange={(e) => setNotifyEmail(e.target.checked)}
                aria-label="Bật/tắt thông báo qua email"
                className="w-5 h-5 accent-zm-blue shrink-0"
              />
            </label>
            <label className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">Thông báo đẩy</p>
                <p className="text-xs text-zm-muted">Nhận thông báo ngay trên trình duyệt</p>
              </div>
              <input
                type="checkbox"
                checked={notifyPush}
                onChange={(e) => setNotifyPush(e.target.checked)}
                aria-label="Bật/tắt thông báo đẩy"
                className="w-5 h-5 accent-zm-blue shrink-0"
              />
            </label>
          </div>
        </div>

        <div className="bg-zm-card rounded-2xl border border-zm-border p-5">
          <h2 className="font-bold text-base mb-3">Ngôn ngữ</h2>
          <select
            disabled
            defaultValue="vi"
            aria-label="Ngôn ngữ (sắp ra mắt)"
            className="w-full bg-zm-bg border border-zm-border rounded-lg px-3 py-2.5 text-sm outline-none text-zm-muted cursor-not-allowed"
          >
            <option value="vi">Tiếng Việt</option>
            <option value="en">English</option>
          </select>
          <p className="text-xs text-zm-muted mt-2">Sắp ra mắt — hiện chỉ hỗ trợ Tiếng Việt.</p>
        </div>

        <div className="bg-zm-card rounded-2xl border border-zm-border p-5">
          <h2 className="font-bold text-base mb-3 flex items-center gap-2">
            <FaUserSlash size={14} className="text-zm-muted" aria-hidden="true" /> Người dùng đã chặn
          </h2>
          {blockedLoading ? (
            <p className="text-sm text-zm-muted">Đang tải...</p>
          ) : blockedUsers.length === 0 ? (
            <p className="text-sm text-zm-muted">Bạn chưa chặn người dùng nào.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {blockedUsers.map((user) => (
                <div key={user.id} className="flex items-center gap-3 py-1">
                  <Avatar src={user.avatar} alt="" className="w-9 h-9 shrink-0" />
                  <p className="text-sm font-medium flex-1 min-w-0 truncate">{user.name}</p>
                  <button
                    type="button"
                    onClick={() => unblockUser(user)}
                    className="flex items-center gap-1.5 text-xs font-semibold border border-zm-border rounded-lg px-3 py-1.5 hover:bg-zm-hover transition-colors shrink-0"
                  >
                    <FaBan size={10} aria-hidden="true" /> Bỏ chặn
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-zm-card rounded-2xl border border-zm-heart/40 p-5">
          <h2 className="font-bold text-base mb-1 flex items-center gap-2 text-zm-heart">
            <FaExclamationTriangle size={14} aria-hidden="true" /> Vùng nguy hiểm
          </h2>
          <p className="text-sm text-zm-muted mb-3">
            Xoá tài khoản sẽ xoá vĩnh viễn toàn bộ bài viết, tin nhắn, bạn bè và dữ liệu liên quan. Hành động này không thể hoàn tác.
          </p>

          {!deleteConfirming ? (
            <button
              type="button"
              onClick={() => setDeleteConfirming(true)}
              className="text-sm font-semibold text-zm-heart border border-zm-heart/40 rounded-lg px-4 py-2 hover:bg-zm-heart/10 transition-colors"
            >
              Xoá tài khoản
            </button>
          ) : (
            <form onSubmit={submitDelete} className="flex flex-col gap-3">
              <p className="text-sm font-medium">Nhập mật khẩu để xác nhận xoá tài khoản vĩnh viễn:</p>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => {
                  setDeletePassword(e.target.value);
                  setDeleteError("");
                }}
                placeholder="Mật khẩu hiện tại"
                aria-label="Mật khẩu hiện tại để xác nhận xoá tài khoản"
                className="bg-zm-bg border border-zm-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-zm-heart placeholder-zm-muted"
              />
              {deleteError && <p className="text-sm text-zm-heart font-medium">{deleteError}</p>}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setDeleteConfirming(false);
                    setDeletePassword("");
                    setDeleteError("");
                  }}
                  className="flex-1 text-sm font-semibold rounded-lg py-2 border border-zm-border hover:bg-zm-hover transition-colors"
                >
                  Huỷ
                </button>
                <button
                  type="submit"
                  disabled={deleting}
                  className="flex-1 text-sm font-semibold rounded-lg py-2 bg-zm-heart text-white hover:opacity-90 disabled:opacity-60 transition-opacity"
                >
                  {deleting ? "Đang xoá..." : "Xác nhận xoá vĩnh viễn"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
