import { FaBookmark } from "react-icons/fa";
import { useSaved } from "../context/SavedContext";
import PostCard from "../components/feed/PostCard";
import LoadingIndicator from "../components/common/LoadingIndicator";

export default function Saved() {
  const { savedPosts, loading, hasMore, loadingMore, loadMore } = useSaved();

  return (
    <div className="max-w-4xl mx-auto">
      {loading ? (
        <div className="bg-zm-card rounded-2xl border border-zm-border p-10">
          <LoadingIndicator />
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
