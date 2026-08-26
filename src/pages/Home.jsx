import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import PostComposer from "../components/feed/PostComposer";
import PostCard from "../components/feed/PostCard";
import PostCardSkeleton from "../components/feed/PostCardSkeleton";
import ForumHighlights from "../components/forum/ForumHighlights";
import * as postsApi from "../api/posts";

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState([]);
  const [highlightId, setHighlightId] = useState(null);
  const location = useLocation();

  useEffect(() => {
    let cancelled = false;
    postsApi
      .getFeed()
      .then((page) => {
        if (!cancelled) setPosts(page.content.map(postsApi.toFrontendPost));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const targetId = location.state?.scrollToPostId;
    if (loading || !targetId) return;

    const el = document.getElementById(`post-${targetId}`);
    if (!el) return;

    el.scrollIntoView({ behavior: "smooth", block: "center" });
    setHighlightId(targetId);
    window.history.replaceState({}, "");
    const timer = setTimeout(() => setHighlightId(null), 2000);
    return () => clearTimeout(timer);
  }, [loading, location.state]);

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

  return (
    <div className="max-w-2xl mx-auto">
      <ForumHighlights />
      <PostComposer onPost={addPost} />

      {loading ? (
        <>
          <PostCardSkeleton />
          <PostCardSkeleton />
          <PostCardSkeleton />
        </>
      ) : (
        posts.map((p) => (
          <div
            key={p.id}
            id={`post-${p.id}`}
            className={`rounded-2xl transition-shadow ${
              highlightId === p.id ? "ring-2 ring-zm-blue shadow-[0_0_30px_rgba(139,92,246,0.4)]" : ""
            }`}
          >
            <PostCard post={p} onUpdated={updatePostInList} onDeleted={removePostFromList} />
          </div>
        ))
      )}
    </div>
  );
}
