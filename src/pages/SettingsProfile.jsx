import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaCamera, FaCheck, FaArrowLeft } from "react-icons/fa";
import { useCurrentUser } from "../context/UserContext";
import { useToast } from "../context/ToastContext";
import { uploadImage } from "../api/uploads";
import Avatar from "../components/common/Avatar";

export default function SettingsProfile() {
  const { currentUser, updateProfile } = useCurrentUser();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const avatarInputRef = useRef(null);

  const [form, setForm] = useState({
    name: currentUser.name,
    bio: currentUser.bio,
    work: currentUser.work,
    location: currentUser.location,
    gender: currentUser.gender || "",
    avatar: currentUser.avatar,
  });
  const [saved, setSaved] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const setField = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
    setSaved(false);
  };

  const pickImage = (key) => async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setForm((prev) => ({ ...prev, [key]: previewUrl }));
    setSaved(false);

    setUploadingAvatar(true);
    try {
      const url = await uploadImage(file);
      setForm((prev) => (prev[key] === previewUrl ? { ...prev, [key]: url } : prev));
    } catch (err) {
      showToast(err.message || "Không thể tải ảnh lên", "error");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const submit = (e) => {
    e.preventDefault();
    updateProfile(form);
    setSaved(true);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        to="/settings"
        className="inline-flex items-center gap-2 text-sm font-semibold text-zm-muted hover:text-zm-blue-light mb-4 transition-colors"
      >
        <FaArrowLeft size={12} aria-hidden="true" /> Về Cài đặt
      </Link>

      <form onSubmit={submit} className="bg-zm-card rounded-2xl border border-zm-border overflow-hidden">
        <div className="flex items-center gap-4 p-6 pb-0">
          <div className="relative shrink-0">
            <Avatar src={form.avatar} alt="Ảnh đại diện" className="w-20 h-20 ring-4 ring-zm-bg bg-zm-bg" />
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={uploadingAvatar}
              aria-label="Đổi ảnh đại diện"
              className="absolute bottom-0 right-0 w-9 h-9 flex items-center justify-center bg-zm-bg hover:bg-zm-hover disabled:opacity-60 rounded-full ring-2 ring-zm-card"
            >
              <FaCamera size={11} aria-hidden="true" />
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              hidden
              aria-label="Chọn ảnh đại diện"
              onChange={pickImage("avatar")}
            />
          </div>
        </div>

        <div className="p-6 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold">Tên hiển thị</span>
            <input
              value={form.name}
              onChange={setField("name")}
              required
              className="bg-zm-bg border border-zm-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-zm-blue"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold">Tiểu sử</span>
            <textarea
              value={form.bio}
              onChange={setField("bio")}
              rows={3}
              className="bg-zm-bg border border-zm-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-zm-blue resize-none"
            />
          </label>

          <div className="grid sm:grid-cols-2 gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold">Công việc</span>
              <input
                value={form.work}
                onChange={setField("work")}
                className="bg-zm-bg border border-zm-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-zm-blue"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold">Địa điểm</span>
              <input
                value={form.location}
                onChange={setField("location")}
                className="bg-zm-bg border border-zm-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-zm-blue"
              />
            </label>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold">Giới tính</span>
            <select
              value={form.gender}
              onChange={setField("gender")}
              className="bg-zm-bg border border-zm-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-zm-blue"
            >
              <option value="">Không hiển thị</option>
              <option value="Nam">Nam</option>
              <option value="Nữ">Nữ</option>
              <option value="Khác">Khác</option>
            </select>
          </label>

          <div className="flex items-center gap-3 mt-2 pt-4 border-t border-zm-border">
            <button
              type="submit"
              disabled={uploadingAvatar}
              className="bg-gradient-to-r from-zm-blue to-zm-blue-light hover:opacity-90 disabled:opacity-60 text-white font-semibold text-sm px-5 min-h-11 rounded-xl transition-opacity"
            >
              {uploadingAvatar ? "Đang tải ảnh..." : "Lưu thay đổi"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/profile")}
              className="text-sm font-semibold text-zm-muted hover:text-zm-text px-3 min-h-11"
            >
              Hủy
            </button>
            {saved && (
              <span className="flex items-center gap-1.5 text-sm text-emerald-400 font-medium ml-auto">
                <FaCheck size={12} aria-hidden="true" /> Đã lưu
              </span>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
