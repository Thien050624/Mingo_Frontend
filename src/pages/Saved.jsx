import { FaBookmark } from "react-icons/fa";
import { useSaved } from "../context/SavedContext";
import PostCard from "../components/feed/PostCard";

export default function Saved() {
  const { savedPosts, loading, hasMore, loadingMore, loadMore } = useSaved();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="relative overflow-hidden rounded-xl border border-zm-border bg-gradient-to-br from-zm-blue/25 via-zm-card to-zm-card px-4 py-3 mb-4">
        <div className="absolute -top-10 -right-6 w-28 h-28 rounded-full bg-zm-blue-light/20 blur-3xl pointer-events-none" />
        <div className="relative flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-zm-blue-light">
          <FaBookmark size={11} aria-hidden="true" /> Đã lưu
        </div>
        <h1 className="relative text-lg font-extrabold mt-0.5">
          Những bài viết bạn đã <span className="glow-text">lưu lại</span>
        </h1>
        <p className="relative text-xs text-zm-muted mt-0.5">
          {savedPosts.length} bài viết · Chỉ mình bạn thấy được danh sách này
        </p>
      </div>

      {loading ? (
        <div className="bg-zm-card rounded-2xl border border-zm-border p-10 text-center text-sm text-zm-muted">
          Đang tải...
        </div>
      ) : savedPosts.length === 0 ? (
        <div className="bg-zm-card rounded-2xl border border-zm-border p-10 text-center">
          <FaBookmark className="mx-auto text-zm-muted mb-3" size={28} aria-hidden="true" />
          <p className="font-semibold mb-1">Chưa có bài viết nào được lưu</p>
          <p className="text-sm text-zm-muted">
            Bấm biểu tượng "..." trên 1 bài viết và chọn "Lưu bài viết" để xem lại sau.
          </p>
        </div>
      ) : (
        <>
          {savedPosts.map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
          {hasMore && (
            <div className="text-center py-3">
              <button
                type="button"
                onClick={loadMore}
                disabled={loadingMore}
                className="text-sm font-semibold text-zm-blue-light hover:underline disabled:opacity-60"
              >
                {loadingMore ? "Đang tải..." : "Xem thêm"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
