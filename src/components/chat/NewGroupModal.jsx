import { useEffect, useState } from "react";
import { FaTimes, FaSearch } from "react-icons/fa";
import * as friendsApi from "../../api/friends";
import { useCurrentUser } from "../../context/UserContext";
import Avatar from "../common/Avatar";

export default function NewGroupModal({ onClose, onCreate }) {
  const { currentUser } = useCurrentUser();
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [name, setName] = useState("");
  const [selected, setSelected] = useState(() => new Set());
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    friendsApi
      .listFriends(currentUser.id)
      .then((list) => setFriends(list.map(friendsApi.toFrontendPerson)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [currentUser?.id]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredFriends = friends.filter((f) => (f.name || "").toLowerCase().includes(query.trim().toLowerCase()));
  const canSubmit = name.trim() && selected.size > 0 && !submitting;

  const submit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await onCreate(name.trim(), Array.from(selected));
    } catch (err) {
      console.error("Không thể tạo nhóm:", err);
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm bg-zm-card rounded-2xl border border-zm-border shadow-2xl glow-violet flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-zm-border shrink-0">
          <h2 className="font-bold text-lg">Tạo nhóm chat</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-zm-hover text-zm-muted"
          >
            <FaTimes size={14} aria-hidden="true" />
          </button>
        </div>

        <div className="p-4 flex flex-col gap-3 overflow-y-auto">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tên nhóm"
            aria-label="Tên nhóm"
            className="bg-zm-bg border border-zm-border rounded-lg px-3 py-2 text-sm outline-none placeholder-zm-muted"
          />

          <div className="flex items-center bg-zm-bg rounded-full px-3 h-9">
            <FaSearch className="text-zm-muted text-xs shrink-0" aria-hidden="true" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm bạn bè"
              aria-label="Tìm bạn bè"
              className="bg-transparent outline-none px-2 text-sm flex-1 placeholder-zm-muted"
            />
          </div>

          {loading ? (
            <p className="text-sm text-zm-muted text-center py-4">Đang tải danh sách bạn bè...</p>
          ) : filteredFriends.length === 0 ? (
            <p className="text-sm text-zm-muted text-center py-4">Không tìm thấy bạn bè nào.</p>
          ) : (
            <div className="flex flex-col gap-1 max-h-60 overflow-y-auto">
              {filteredFriends.map((f) => (
                <label
                  key={f.id}
                  className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-zm-hover cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(f.id)}
                    onChange={() => toggleSelect(f.id)}
                    className="accent-zm-blue"
                  />
                  <Avatar src={f.avatar} alt="" className="w-8 h-8" />
                  <span className="text-sm truncate">{f.name}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="p-3 border-t border-zm-border shrink-0">
          <button
            type="button"
            onClick={submit}
            disabled={!canSubmit}
            className="w-full bg-gradient-to-br from-zm-blue to-zm-blue-light disabled:opacity-50 text-white font-semibold text-sm rounded-lg py-2.5"
          >
            Tạo nhóm ({selected.size})
          </button>
        </div>
      </div>
    </div>
  );
}
