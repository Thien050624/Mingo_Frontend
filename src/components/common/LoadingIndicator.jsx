import { FaSpinner } from "react-icons/fa";
import useSlowLoad from "../../hooks/useSlowLoad";

const SLOW_TEXT = "Máy chủ đang khởi động, vui lòng đợi thêm ít giây...";

export default function LoadingIndicator({ text = "Đang tải...", className = "" }) {
  const slow = useSlowLoad();

  return (
    <div className={`flex flex-col items-center justify-center gap-2 text-center ${className}`}>
      <FaSpinner className="animate-spin text-zm-blue-light" size={18} aria-hidden="true" />
      <span className="text-sm text-zm-muted">{slow ? SLOW_TEXT : text}</span>
    </div>
  );
}

export function SlowLoadBanner({ className = "" }) {
  const slow = useSlowLoad();
  if (!slow) return null;
  return (
    <p className={`text-xs text-zm-muted text-center ${className}`}>{SLOW_TEXT}</p>
  );
}
