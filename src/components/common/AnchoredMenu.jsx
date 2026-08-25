import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const VIEWPORT_MARGIN = 8;

/**
 * Renders `children` into document.body as a fixed-position dropdown anchored
 * below `anchorRef`. Escapes any ancestor's `overflow-hidden`/`overflow-auto`
 * clipping, so it can never get cut off by a short card/container.
 *
 * After the initial anchor-relative placement, a second pass measures the
 * menu's own rendered size and clamps it back inside the viewport — without
 * this, a menu anchored near a screen edge (very common on narrow/mobile
 * viewports) can render partly or fully off-screen.
 */
export default function AnchoredMenu({ anchorRef, open, onClose, align = "right", offset = 4, className = "", children }) {
  const menuRef = useRef(null);
  const [pos, setPos] = useState(null);

  useLayoutEffect(() => {
    if (!open) return;
    const update = () => {
      const anchor = anchorRef.current;
      if (!anchor) return;
      const rect = anchor.getBoundingClientRect();
      setPos({
        top: rect.bottom + offset,
        left: align === "left" ? rect.left : null,
        right: align === "right" ? window.innerWidth - rect.right : null,
      });
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open, anchorRef, align, offset]);

  useLayoutEffect(() => {
    if (!open || !pos || !menuRef.current) return;
    const rect = menuRef.current.getBoundingClientRect();
    let { top, left, right } = pos;
    let changed = false;

    if (rect.right > window.innerWidth - VIEWPORT_MARGIN) {
      left = window.innerWidth - rect.width - VIEWPORT_MARGIN;
      right = null;
      changed = true;
    }
    if (rect.left < VIEWPORT_MARGIN) {
      left = VIEWPORT_MARGIN;
      right = null;
      changed = true;
    }
    if (rect.bottom > window.innerHeight - VIEWPORT_MARGIN) {
      top = Math.max(VIEWPORT_MARGIN, window.innerHeight - rect.height - VIEWPORT_MARGIN);
      changed = true;
    }

    if (changed) setPos({ top, left, right });
    // Runs once more after the menu's real size is known; converges immediately
    // since the recomputed rect then satisfies the bounds and `changed` stays false.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, pos?.top, pos?.left, pos?.right]);

  useEffect(() => {
    if (!open) return;
    const onMouseDown = (e) => {
      if (menuRef.current?.contains(e.target)) return;
      if (anchorRef.current?.contains(e.target)) return;
      onClose();
    };
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", onMouseDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose, anchorRef]);

  if (!open || !pos) return null;

  return createPortal(
    <div
      ref={menuRef}
      role="menu"
      style={{ position: "fixed", top: pos.top, left: pos.left ?? undefined, right: pos.right ?? undefined }}
      className={className}
    >
      {children}
    </div>,
    document.body
  );
}
