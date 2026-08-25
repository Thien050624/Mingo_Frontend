import { createContext, useContext, useEffect, useState } from "react";
import * as postsApi from "../api/posts";
import { useCurrentUser } from "./UserContext";

const SavedContext = createContext(null);

export function SavedProvider({ children }) {
  const { currentUser } = useCurrentUser();
  const [savedPosts, setSavedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      setSavedPosts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    postsApi
      .getSavedPosts(0, 20)
      .then((res) => {
        setSavedPosts(res.content.map(postsApi.toFrontendPost));
        setPage(0);
        setHasMore(!res.last);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [currentUser?.id]);

  const loadMore = async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const res = await postsApi.getSavedPosts(nextPage, 20);
      setSavedPosts((prev) => [...prev, ...res.content.map(postsApi.toFrontendPost)]);
      setPage(nextPage);
      setHasMore(!res.last);
    } catch (err) {
      console.error("Không thể tải thêm bài viết đã lưu:", err);
    } finally {
      setLoadingMore(false);
    }
  };

  const removeSavedPost = (postId) => {
    setSavedPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  const addSavedPost = (post) => {
    setSavedPosts((prev) => (prev.some((p) => p.id === post.id) ? prev : [post, ...prev]));
  };

  return (
    <SavedContext.Provider
      value={{ savedPosts, loading, hasMore, loadingMore, loadMore, removeSavedPost, addSavedPost }}
    >
      {children}
    </SavedContext.Provider>
  );
}

export function useSaved() {
  const ctx = useContext(SavedContext);
  if (!ctx) throw new Error("useSaved must be used within a SavedProvider");
  return ctx;
}
