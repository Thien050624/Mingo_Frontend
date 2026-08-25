import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaCheck } from "react-icons/fa";
import { suggestedAvatars } from "../data/mockData";
import { useCurrentUser } from "../context/UserContext";
import Avatar from "../components/common/Avatar";

const genders = ["Nam", "Nữ", "Khác"];

export default function Onboarding() {
  const { updateProfile } = useCurrentUser();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [gender, setGender] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState("");
  const [work, setWork] = useState("");
  const [location, setLocation] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = name.trim() && gender && selectedAvatar;

  const visibleAvatars =
    gender === "Nam" || gender === "Nữ"
      ? suggestedAvatars.filter((a) => a.gender === gender)
      : suggestedAvatars;

  const chooseGender = (g) => {
    setGender(g);
    const stillVisible =
      g === "Nam" || g === "Nữ" ? suggestedAvatars.filter((a) => a.gender === g) : suggestedAvatars;
    if (!stillVisible.some((a) => a.src === selectedAvatar)) {
      setSelectedAvatar("");
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setError("");
    setSubmitting(true);
    try {
      await updateProfile({
        name: name.trim(),
        gender,
        avatar: selectedAvatar,
        work: work.trim(),
        location: location.trim(),
      });
      navigate("/");
    } catch (err) {
      setError(err.message || "Đã có lỗi xảy ra, vui lòng thử lại sau");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zm-bg bg-noise flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-zm-card rounded-2xl shadow-2xl border border-zm-border overflow-hidden glow-violet">
        <div className="p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-zm-blue-light">
            Chào mừng tới Mingo
          </p>
          <h1 className="text-2xl font-extrabold mt-1">
            Hoàn thiện <span className="glow-text">hồ sơ của bạn</span>
          </h1>
          <p className="text-sm text-zm-muted mt-1 mb-6">
            Tên, giới tính và ảnh đại diện là bắt buộc — phần còn lại có thể bổ sung sau trong Cài đặt.
          </p>

          <form onSubmit={submit} className="flex flex-col gap-5">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold">
                Tên hiển thị <span className="text-zm-orange">*</span>
              </span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Tên bạn muốn hiển thị"
                className="bg-zm-bg border border-zm-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-zm-blue placeholder-zm-muted"
              />
            </label>

            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold">
                Giới tính <span className="text-zm-orange">*</span>
              </span>
              <div className="flex gap-2">
                {genders.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => chooseGender(g)}
                    aria-pressed={gender === g}
                    className={`flex-1 min-h-11 rounded-lg text-sm font-semibold border ${
                      gender === g
                        ? "bg-gradient-to-r from-zm-blue to-zm-blue-light text-white border-transparent"
                        : "bg-zm-bg border-zm-border text-zm-muted hover:text-zm-text"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold">
                Chọn ảnh đại diện <span className="text-zm-orange">*</span>
              </span>
              {!gender ? (
                <p className="text-xs text-zm-muted py-2">Chọn giới tính ở trên để xem ảnh đại diện phù hợp.</p>
              ) : (
                <div className="grid grid-cols-4 gap-2.5">
                  {visibleAvatars.map(({ src }) => (
                    <button
                      key={src}
                      type="button"
                      onClick={() => setSelectedAvatar(src)}
                      aria-pressed={selectedAvatar === src}
                      aria-label="Chọn ảnh đại diện này"
                      className={`relative rounded-2xl overflow-hidden ring-2 transition-all ${
                        selectedAvatar === src
                          ? "ring-zm-blue glow-violet"
                          : "ring-transparent hover:ring-zm-border"
                      }`}
                    >
                      <Avatar src={src} alt="" className="w-full aspect-square" />
                      {selectedAvatar === src && (
                        <span className="absolute inset-0 bg-zm-blue/30 flex items-center justify-center">
                          <FaCheck className="text-white" size={16} aria-hidden="true" />
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-semibold">Công việc</span>
                <input
                  value={work}
                  onChange={(e) => setWork(e.target.value)}
                  placeholder="Không bắt buộc"
                  className="bg-zm-bg border border-zm-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-zm-blue placeholder-zm-muted"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-semibold">Địa điểm</span>
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Không bắt buộc"
                  className="bg-zm-bg border border-zm-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-zm-blue placeholder-zm-muted"
                />
              </label>
            </div>

            {error && <p className="text-xs text-zm-heart font-medium">{error}</p>}

            <button
              type="submit"
              disabled={!canSubmit || submitting}
              className="bg-gradient-to-r from-zm-blue to-zm-blue-light disabled:from-zm-border disabled:to-zm-border disabled:text-zm-muted hover:opacity-90 text-white font-bold rounded-lg min-h-11 text-sm transition-opacity"
            >
              {submitting ? "Đang lưu..." : "Hoàn tất & vào Mingo"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
