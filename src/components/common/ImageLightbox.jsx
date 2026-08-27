import { useEffect } from "react";
import { Link } from "react-router-dom";
import { FaTimes, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { isVideoUrl } from "../../utils/media";
import { visibilityMeta } from "../../data/postVisibility";
import Avatar from "./Avatar";
import PostComments from "../feed/PostComments";

export default function ImageLightbox({ images, index, onClose, onNavigate, post, commentsProps }) {
  const hasMultiple = images.length > 1;

  useEffect(() => {
    const onKeyDown = (e) => {
      const isTyping = ["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName);
      if (e.key === "Escape") onClose();
      if (isTyping) return;
      if (hasMultiple && e.key === "ArrowLeft") onNavigate((index - 1 + images.length) % images.length);
      if (hasMultiple && e.key === "ArrowRight") onNavigate((index + 1) % images.length);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, onNavigate, hasMultiple, index, images.length]);

  const meta = visibilityMeta[post.visibility] || visibilityMeta.PUBLIC;
  const VisibilityIcon = meta.icon;
  const currentImageUrl = images[index];
  const imageComments = commentsProps.comments.filter((c) => c.imageUrl === currentImageUrl);

  return (
    <div className="fixed inset-0 z-[60] flex flex-col sm:flex-row bg-black/95">
      <button
        type="button"
        onClick={onClose}
        aria-label="Đóng"
        className="absolute top-4 right-4 z-20 w-11 h-11 flex items-center justify-center text-white/80 hover:text-white rounded-full hover:bg-white/10"
      >
        <FaTimes size={22} aria-hidden="true" />
      </button>

      <div className="relative flex-1 min-w-0 min-h-0 flex items-center justify-center p-4" onClick={onClose}>
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
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-white/70 text-sm">
            {index + 1} / {images.length}
          </div>
        )}
      </div>

      <div
        className="w-full sm:w-96 shrink-0 min-h-0 max-h-[45vh] sm:max-h-none bg-zm-card border-t sm:border-t-0 sm:border-l border-zm-border flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2.5 p-3 border-b border-zm-border shrink-0">
          <Link to={`/profile/${post.author.id}`} className="shrink-0">
            <Avatar src={post.author.avatar} alt={`Ảnh đại diện của ${post.author.name}`} className="w-9 h-9" />
          </Link>
          <div className="min-w-0">
            <Link
              to={`/profile/${post.author.id}`}
              className="font-semibold text-sm hover:text-zm-blue-light truncate transition-colors block"
            >
              {post.author.name}
            </Link>
            <div className="flex items-center gap-1 text-xs text-zm-muted">
              <span>{post.time}</span>
              <VisibilityIcon size={9} aria-label={meta.label} title={meta.label} />
            </div>
          </div>
        </div>
        {post.content && (
          <p className="px-3 pt-2 text-sm whitespace-pre-line leading-relaxed shrink-0">{post.content}</p>
        )}

        <PostComments
          {...commentsProps}
          comments={imageComments}
          submitComment={() => commentsProps.submitComment(currentImageUrl)}
          variant="panel"
        />
      </div>
    </div>
  );
}
