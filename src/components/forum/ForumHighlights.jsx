import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaComments, FaArrowRight } from "react-icons/fa";
import * as forumApi from "../../api/forum";

export default function ForumHighlights() {
  const [roomCount, setRoomCount] = useState(null);

  useEffect(() => {
    forumApi
      .listRooms()
      .then((res) => setRoomCount(res.length))
      .catch(() => {});
  }, []);

  if (roomCount === null) return null;

  return (
    <Link
      to="/forum"
      className="group flex items-center justify-between bg-zm-card rounded-2xl border border-zm-border p-4 mb-5 hover:border-zm-blue/50 hover:shadow-[0_0_0_1px_rgba(139,92,246,0.35),0_10px_35px_-12px_rgba(139,92,246,0.35)] transition-all"
    >
      <h2 className="flex items-center gap-1.5 text-sm font-bold text-zm-muted">
        <FaComments className="text-zm-blue-light" size={13} aria-hidden="true" />
        {roomCount} phòng đang hoạt động
      </h2>
      <span className="flex items-center gap-1 text-xs font-semibold text-zm-blue-light group-hover:underline">
        Xem tất cả <FaArrowRight size={10} aria-hidden="true" />
      </span>
    </Link>
  );
}
