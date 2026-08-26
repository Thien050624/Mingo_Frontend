import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaComments, FaPlus, FaTimes } from "react-icons/fa";
import * as forumApi from "../api/forum";
import Avatar from "../components/common/Avatar";

export default function ForumRooms() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const load = () => {
    setLoading(true);
    forumApi
      .listRooms()
      .then((res) => {
        setRooms(res.map(forumApi.toFrontendRoom));
        setError(false);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const submitCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    setCreateError("");
    try {
      await forumApi.createRoom(name.trim(), description.trim());
      setShowCreate(false);
      setName("");
      setDescription("");
      load();
    } catch (err) {
      setCreateError(err.message || "Không thể tạo phòng");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-extrabold">Diễn đàn</h1>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-zm-blue to-zm-blue-light text-white font-semibold text-sm px-4 min-h-11 rounded-lg hover:opacity-90 transition-opacity"
        >
          <FaPlus size={12} aria-hidden="true" /> Tạo phòng
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-center justify-between gap-3 text-sm text-red-400 mb-4">
          <span>Không thể tải danh sách phòng. Vui lòng thử lại.</span>
          <button
            type="button"
            onClick={load}
            className="shrink-0 min-h-11 px-3 rounded-lg border border-red-500/40 font-semibold hover:bg-red-500/10 transition-colors"
          >
            Thử lại
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="bg-zm-card rounded-2xl border border-zm-border p-4 h-24 animate-pulse" />
          ))}
        </div>
      ) : rooms.length === 0 && !error ? (
        <div className="bg-zm-card rounded-2xl border border-zm-border p-10 text-center">
          <FaComments className="mx-auto text-zm-muted mb-3" size={28} aria-hidden="true" />
          <p className="font-semibold mb-1">Chưa có phòng nào</p>
          <p className="text-sm text-zm-muted">Tạo phòng đầu tiên để bắt đầu trò chuyện.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {rooms.map((room) => (
            <Link
              key={room.id}
              to={`/forum/${room.id}`}
              className="group bg-zm-card rounded-2xl border border-zm-border p-4 hover:border-zm-blue/50 hover:shadow-[0_0_0_1px_rgba(139,92,246,0.35),0_10px_35px_-12px_rgba(139,92,246,0.35)] transition-all"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-zm-blue to-zm-blue-light flex items-center justify-center text-white glow-violet shrink-0">
                  <FaComments size={15} aria-hidden="true" />
                </div>
                <p className="font-bold text-sm truncate group-hover:text-zm-blue-light transition-colors">{room.name}</p>
              </div>
              {room.description && <p className="text-xs text-zm-muted line-clamp-2 mb-2">{room.description}</p>}
              <div className="flex items-center gap-1.5 text-[11px] text-zm-muted">
                <Avatar src={room.createdBy.avatar} alt="" className="w-4 h-4" />
                <span className="truncate">Tạo bởi {room.createdBy.name || "Người dùng"}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm bg-zm-card rounded-2xl border border-zm-border shadow-2xl glow-violet">
            <div className="flex items-center justify-between px-4 py-3 border-b border-zm-border">
              <h2 className="font-bold text-base">Tạo phòng mới</h2>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                aria-label="Đóng"
                className="w-11 h-11 flex items-center justify-center text-zm-muted hover:text-zm-heart"
              >
                <FaTimes size={14} aria-hidden="true" />
              </button>
            </div>
            <form onSubmit={submitCreate} className="p-4 flex flex-col gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-semibold">Tên phòng *</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  maxLength={100}
                  autoFocus
                  className="bg-zm-bg border border-zm-border rounded-lg px-3 min-h-11 text-sm outline-none focus:border-zm-blue"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-semibold">Mô tả</span>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={300}
                  rows={3}
                  className="bg-zm-bg border border-zm-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-zm-blue resize-none"
                />
              </label>
              {createError && <p className="text-xs text-zm-heart font-medium">{createError}</p>}
              <button
                type="submit"
                disabled={creating || !name.trim()}
                className="bg-gradient-to-r from-zm-blue to-zm-blue-light disabled:opacity-60 hover:opacity-90 text-white font-bold rounded-lg min-h-11 text-sm transition-opacity"
              >
                {creating ? "Đang tạo..." : "Tạo phòng"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
