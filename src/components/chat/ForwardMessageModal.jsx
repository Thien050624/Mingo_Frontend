import { useEffect, useState } from "react";
import { FaTimes, FaSearch, FaUserFriends } from "react-icons/fa";
import Avatar from "../common/Avatar";

export default function ForwardMessageModal({ conversations, onClose, onForward }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(() => new Set());
  const [submitting, setSubmitting] = useState(false);

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

  const filtered = conversations.filter((c) => (c.user?.name || "").toLowerCase().includes(query.trim().toLowerCase()));
  const canSubmit = selected.size > 0 && !submitting;

  const submit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await onForward(Array.from(selected));
    } catch (err) {
      console.error("Không thể chuyển tiếp tin nhắn:", err);
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm bg-zm-card rounded-2xl border border-zm-border shadow-2xl glow-violet flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-zm-border shrink-0">
          <h2 className="font-bold text-lg">Chuyển tiếp tin nhắn</h2>
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
          <div className="flex items-center bg-zm-bg rounded-full px-3 h-9">
            <FaSearch className="text-zm-muted text-xs shrink-0" aria-hidden="true" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm cuộc trò chuyện"
              aria-label="Tìm cuộc trò chuyện để chuyển tiếp"
              className="bg-transparent outline-none px-2 text-sm flex-1 placeholder-zm-muted"
            />
          </div>

          {filtered.length === 0 ? (
            <p className="text-sm text-zm-muted text-center py-4">Không tìm thấy cuộc trò chuyện nào.</p>
          ) : (
            <div className="flex flex-col gap-1 max-h-72 overflow-y-auto">
              {filtered.map((c) => (
                <label
                  key={c.id}
                  className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-zm-hover cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(c.id)}
                    onChange={() => toggleSelect(c.id)}
                    className="accent-zm-blue"
                  />
                  {c.group && !c.user.avatar ? (
                    <div className="w-8 h-8 rounded-full bg-zm-blue/20 text-zm-blue-light flex items-center justify-center shrink-0">
                      <FaUserFriends size={13} aria-hidden="true" />
                    </div>
                  ) : (
                    <Avatar src={c.user.avatar} alt="" className="w-8 h-8" />
                  )}
                  <span className="text-sm truncate">{c.user.name}</span>
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
            Chuyển tiếp {selected.size > 0 ? `(${selected.size})` : ""}
          </button>
        </div>
      </div>
    </div>
  );
}
