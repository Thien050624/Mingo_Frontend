import { Link } from "react-router-dom";
import { FaCog, FaUserShield, FaUserEdit, FaChevronRight } from "react-icons/fa";

const cards = [
  {
    to: "/settings/account",
    icon: FaUserShield,
    title: "Cài đặt tài khoản",
    description: "Email, mật khẩu, ngôn ngữ và tuỳ chọn thông báo.",
  },
  {
    to: "/settings/profile",
    icon: FaUserEdit,
    title: "Chỉnh sửa hồ sơ cá nhân",
    description: "Tên hiển thị, ảnh đại diện, tiểu sử, công việc, địa điểm.",
  },
];

export default function Settings() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="relative overflow-hidden rounded-2xl border border-zm-border bg-gradient-to-br from-zm-blue/25 via-zm-card to-zm-card p-5 mb-5">
        <div className="absolute -top-16 -right-10 w-52 h-52 rounded-full bg-zm-blue-light/20 blur-3xl pointer-events-none" />
        <div className="relative flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-zm-blue-light">
          <FaCog aria-hidden="true" /> Cài đặt
        </div>
        <h1 className="relative text-2xl font-extrabold mt-1">
          Bạn muốn chỉnh <span className="glow-text">phần nào?</span>
        </h1>
        <p className="relative text-sm text-zm-muted mt-1">
          Chọn 1 trong 2 mục bên dưới để bắt đầu
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {cards.map(({ to, icon: Icon, title, description }) => (
          <Link
            key={to}
            to={to}
            className="group bg-zm-card rounded-2xl border border-zm-border p-5 hover:border-zm-blue/50 hover:shadow-[0_0_0_1px_rgba(139,92,246,0.35),0_10px_35px_-12px_rgba(139,92,246,0.35)] transition-all"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-zm-blue to-zm-blue-light flex items-center justify-center text-white glow-violet mb-4">
              <Icon size={20} aria-hidden="true" />
            </div>
            <h2 className="font-bold text-base flex items-center gap-1.5 group-hover:text-zm-blue-light transition-colors">
              {title}
              <FaChevronRight size={11} className="text-zm-muted group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
            </h2>
            <p className="text-sm text-zm-muted mt-1.5 leading-relaxed">{description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
