import { useEffect, useRef, useState } from "react";
import { FaImage, FaSmile, FaTimes, FaGlobeAsia, FaUserFriends, FaLock, FaChevronDown } from "react-icons/fa";
import { useCurrentUser } from "../../context/UserContext";
import { useToast } from "../../context/ToastContext";
import * as uploadsApi from "../../api/uploads";
import Avatar from "../common/Avatar";
import AnchoredMenu from "../common/AnchoredMenu";

const feelings = [
  { emoji: "😊", label: "hạnh phúc" },
  { emoji: "😍", label: "yêu đời" },
  { emoji: "😢", label: "buồn" },
  { emoji: "😤", label: "mệt mỏi" },
  { emoji: "🤩", label: "hào hứng" },
  { emoji: "🙏", label: "biết ơn" },
];

const visibilityOptions = [
  { value: "PUBLIC", label: "Công khai", icon: FaGlobeAsia },
  { value: "FRIENDS", label: "Bạn bè", icon: FaUserFriends },
  { value: "PRIVATE", label: "Chỉ mình tôi", icon: FaLock },
];

export default function PostComposer({ onPost }) {
  const { currentUser } = useCurrentUser();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [images, setImages] = useState([]);
  const [showFeelings, setShowFeelings] = useState(false);
  const [visibility, setVisibility] = useState("PUBLIC");
  const [showVisibility, setShowVisibility] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef(null);
  const feelingRef = useRef(null);
  const visibilityButtonRef = useRef(null);

  const currentVisibility = visibilityOptions.find((v) => v.value === visibility);

  useEffect(() => {
    if (!showFeelings) return;
    const onClickOutside = (e) => {
      if (feelingRef.current && !feelingRef.current.contains(e.target)) setShowFeelings(false);
    };
    const onKeyDown = (e) => {
      if (e.key === "Escape") setShowFeelings(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [showFeelings]);

  const handleFiles = (e) => {
    const files = Array.from(e.target.files || []);
    const items = files.map((f) => ({ file: f, preview: URL.createObjectURL(f) }));
    setImages((prev) => [...prev, ...items]);
  };

  const removeImage = (idx) => {
    setImages((prev) => {
      URL.revokeObjectURL(prev[idx].preview);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const pickFeeling = (feeling) => {
    setOpen(true);
    setText((prev) => `${prev}${prev ? " " : ""}— đang cảm thấy ${feeling.emoji} ${feeling.label}`);
    setShowFeelings(false);
  };

  const submit = async () => {
    if (!text.trim() && images.length === 0) return;
    setError("");
    setSubmitting(true);
    try {
      const uploadedUrls = await Promise.all(images.map((img) => uploadsApi.uploadImage(img.file)));
      await onPost?.({ text, images: uploadedUrls, visibility });
      images.forEach((img) => URL.revokeObjectURL(img.preview));
      setText("");
      setImages([]);
      setVisibility("PUBLIC");
      setOpen(false);
      showToast("Đã đăng bài viết");
    } catch (err) {
      setError(err.message || "Đã có lỗi xảy ra, vui lòng thử lại sau");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative bg-zm-card rounded-2xl border border-zm-border p-3 mb-5 overflow-hidden">
      <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-zm-blue/20 blur-3xl pointer-events-none" />

      {!open ? (
        <div className="relative flex items-center gap-2.5">
          <Avatar
            src={currentUser.avatar}
            alt=""
            className="w-10 h-10 shrink-0 ring-2 ring-zm-blue/40"
          />
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex-1 text-left text-zm-muted bg-zm-bg hover:bg-zm-hover border border-zm-border rounded-full px-4 py-2.5 text-sm transition-colors"
          >
            Bạn đang nghĩ gì thế, {(currentUser.name || "").split(" ").pop()}?
          </button>
        </div>
      ) : (
        <div className="relative">
          <div className="flex items-center gap-2.5 mb-3">
            <Avatar
              src={currentUser.avatar}
              alt=""
              className="w-10 h-10 shrink-0 ring-2 ring-zm-blue/40"
            />
            <div>
              <p className="font-semibold text-sm">{currentUser.name}</p>
              <div className="relative">
                <button
                  ref={visibilityButtonRef}
                  type="button"
                  onClick={() => setShowVisibility((v) => !v)}
                  aria-expanded={showVisibility}
                  aria-haspopup="true"
                  className="flex items-center gap-1 text-xs text-zm-blue-light bg-zm-blue/10 hover:bg-zm-blue/20 px-2 py-0.5 rounded-full transition-colors"
                >
                  <currentVisibility.icon size={9} aria-hidden="true" />
                  {currentVisibility.label}
                  <FaChevronDown size={8} aria-hidden="true" />
                </button>
                <AnchoredMenu
                  anchorRef={visibilityButtonRef}
                  open={showVisibility}
                  onClose={() => setShowVisibility(false)}
                  align="left"
                  className="w-44 bg-zm-card border border-zm-border rounded-xl shadow-2xl py-1.5 z-50 glow-violet"
                >
                  {visibilityOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setVisibility(opt.value);
                        setShowVisibility(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-zm-hover transition-colors ${
                        visibility === opt.value ? "text-zm-blue-light font-semibold" : "text-zm-text"
                      }`}
                    >
                      <opt.icon size={12} aria-hidden="true" />
                      {opt.label}
                    </button>
                  ))}
                </AnchoredMenu>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Đóng ô đăng bài"
              className="ml-auto w-11 h-11 flex items-center justify-center text-zm-muted hover:bg-zm-hover rounded-full"
            >
              <FaTimes size={14} aria-hidden="true" />
            </button>
          </div>
          <textarea
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            aria-label="Nội dung bài viết"
            placeholder={`Bạn đang nghĩ gì thế, ${(currentUser.name || "").split(" ").pop()}?`}
            className="w-full outline-none resize-none text-base min-h-[70px] bg-transparent placeholder-zm-muted"
          />
          {images.length > 0 && (
            <div className="grid grid-cols-3 gap-1.5 mb-3">
              {images.map((img, idx) => (
                <div key={idx} className="relative rounded-xl overflow-hidden aspect-square border border-zm-border">
                  <img src={img.preview} alt={`Ảnh đính kèm ${idx + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    aria-label={`Xóa ảnh đính kèm ${idx + 1}`}
                    className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 text-white rounded-full p-1"
                  >
                    <FaTimes size={10} aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="relative flex items-center gap-1 mt-3 pt-2 border-t border-zm-border">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-2 text-sm font-medium text-zm-muted hover:text-emerald-400 hover:bg-zm-hover rounded-lg px-3 py-2 flex-1 justify-center transition-colors"
        >
          <FaImage className="text-emerald-400" aria-hidden="true" /> Ảnh/Video
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          aria-label="Chọn ảnh để đăng"
          onChange={handleFiles}
        />

        <div ref={feelingRef} className="relative flex-1">
          {showFeelings && (
            <div
              role="menu"
              className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-zm-card border border-zm-border rounded-xl shadow-2xl p-2 grid grid-cols-3 gap-1 w-56 z-10 glow-violet"
            >
              {feelings.map((f) => (
                <button
                  key={f.label}
                  type="button"
                  role="menuitem"
                  onClick={() => pickFeeling(f)}
                  aria-label={`Cảm thấy ${f.label}`}
                  className="flex flex-col items-center gap-1 rounded-lg px-2 py-2 hover:bg-zm-hover transition-colors"
                >
                  <span className="text-xl" aria-hidden="true">{f.emoji}</span>
                  <span className="text-[11px] text-zm-muted">{f.label}</span>
                </button>
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={() => setShowFeelings((v) => !v)}
            aria-expanded={showFeelings}
            aria-haspopup="true"
            className="w-full flex items-center gap-2 text-sm font-medium text-zm-muted hover:text-yellow-400 hover:bg-zm-hover rounded-lg px-3 py-2 justify-center transition-colors"
          >
            <FaSmile className="text-yellow-400" aria-hidden="true" /> Cảm xúc
          </button>
        </div>
      </div>

      {open && error && <p className="mt-2 text-xs text-zm-heart font-medium">{error}</p>}

      {open && (
        <button
          type="button"
          onClick={submit}
          disabled={(!text.trim() && images.length === 0) || submitting}
          className="relative w-full mt-2 bg-gradient-to-r from-zm-blue to-zm-blue-light disabled:from-zm-border disabled:to-zm-border disabled:text-zm-muted text-white font-semibold rounded-xl py-2 text-sm transition-colors"
        >
          {submitting ? "Đang đăng..." : "Đăng"}
        </button>
      )}
    </div>
  );
}
