import { useEffect } from "react";
import { createPortal } from "react-dom";

export default function BottomSheet({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-md bg-zm-card rounded-t-2xl border-t border-x border-zm-border shadow-2xl pb-[max(env(safe-area-inset-bottom),0.75rem)] animate-sheet-in"
      >
        <div className="mx-auto mt-2.5 w-10 h-1 rounded-full bg-zm-border" aria-hidden="true" />
        {title && <p className="px-4 pt-3 pb-1 text-sm font-semibold text-zm-muted">{title}</p>}
        <div className="p-2">{children}</div>
      </div>
    </div>,
    document.body
  );
}
