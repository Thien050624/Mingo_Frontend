import { Link } from "react-router-dom";
import { FaGhost, FaHome } from "react-icons/fa";

export default function NotFound() {
  return (
    <div className="max-w-lg mx-auto text-center py-20">
      <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-zm-blue to-zm-blue-light flex items-center justify-center text-white glow-violet mb-5">
        <FaGhost size={34} aria-hidden="true" />
      </div>
      <h1 className="text-3xl font-extrabold glow-text mb-2">404</h1>
      <p className="text-lg font-semibold mb-1">Không tìm thấy trang này</p>
      <p className="text-sm text-zm-muted mb-6">
        Đường dẫn bạn truy cập không tồn tại hoặc đã được di chuyển.
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 bg-gradient-to-r from-zm-blue to-zm-blue-light hover:opacity-90 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-opacity"
      >
        <FaHome size={13} aria-hidden="true" /> Về trang chủ
      </Link>
    </div>
  );
}
