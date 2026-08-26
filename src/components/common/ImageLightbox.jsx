import { useEffect } from "react";
import { FaTimes, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { isVideoUrl } from "../../utils/media";

export default function ImageLightbox({ images, index, onClose, onNavigate }) {
  const hasMultiple = images.length > 1;

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
      if (hasMultiple && e.key === "ArrowLeft") onNavigate((index - 1 + images.length) % images.length);
      if (hasMultiple && e.key === "ArrowRight") onNavigate((index + 1) % images.length);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, onNavigate, hasMultiple, index, images.length]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Đóng"
        className="absolute top-4 right-4 w-11 h-11 flex items-center justify-center text-white/80 hover:text-white rounded-full hover:bg-white/10"
      >
        <FaTimes size={22} aria-hidden="true" />
      </button>

      {hasMultiple && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onNavigate((index - 1 + images.length) % images.length);
          }}
          aria-label="Ảnh trước"
          className="absolute left-2 sm:left-6 text-white/80 hover:text-white p-3 rounded-full hover:bg-white/10"
        >
          <FaChevronLeft size={22} aria-hidden="true" />
        </button>
      )}

      {isVideoUrl(images[index]) ? (
        <video
          src={images[index]}
          controls
          autoPlay
          playsInline
          className="max-w-full max-h-full object-contain"
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <img
          src={images[index]}
          alt="Xem ảnh phóng to"
          className="max-w-full max-h-full object-contain"
          onClick={(e) => e.stopPropagation()}
        />
      )}

      {hasMultiple && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onNavigate((index + 1) % images.length);
          }}
          aria-label="Ảnh tiếp theo"
          className="absolute right-2 sm:right-6 text-white/80 hover:text-white p-3 rounded-full hover:bg-white/10"
        >
          <FaChevronRight size={22} aria-hidden="true" />
        </button>
      )}

      {hasMultiple && (
        <div className="absolute bottom-4 text-white/70 text-sm">
          {index + 1} / {images.length}
        </div>
      )}
    </div>
  );
}
