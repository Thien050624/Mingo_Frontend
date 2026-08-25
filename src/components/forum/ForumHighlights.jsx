import { Link } from "react-router-dom";
import { FaComments, FaArrowRight } from "react-icons/fa";
import { useForum } from "../../context/ForumContext";
import Avatar from "../common/Avatar";

export default function ForumHighlights() {
  const { messages } = useForum();

  const recent = messages.slice(-3).reverse();

  if (recent.length === 0) return null;

  return (
    <Link
      to="/forum"
      className="group block bg-zm-card rounded-2xl border border-zm-border p-4 mb-5 hover:border-zm-blue/50 hover:shadow-[0_0_0_1px_rgba(139,92,246,0.35),0_10px_35px_-12px_rgba(139,92,246,0.35)] transition-all"
    >
      <div className="flex items-center justify-between mb-3">
        <h2 className="flex items-center gap-1.5 text-sm font-bold text-zm-muted">
          <FaComments className="text-zm-blue-light" size={13} aria-hidden="true" /> Đang trò chuyện ở Diễn đàn
        </h2>
        <span className="flex items-center gap-1 text-xs font-semibold text-zm-blue-light group-hover:underline">
          Tham gia <FaArrowRight size={10} aria-hidden="true" />
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {recent.map((m) => (
          <div key={m.id} className="flex items-center gap-2.5">
            <Avatar src={m.author.avatar} alt="" className="w-7 h-7 shrink-0" />
            <p className="text-sm min-w-0 truncate">
              <span className="font-semibold">{m.author.name}: </span>
              <span className="text-zm-muted">{m.content}</span>
            </p>
          </div>
        ))}
      </div>
    </Link>
  );
}
