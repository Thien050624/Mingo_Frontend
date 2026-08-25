import { useState } from "react";
import { FaSun, FaMoon } from "react-icons/fa";

const STORAGE_KEY = "mingo-theme";

function getInitialIsLight() {
  return document.documentElement.getAttribute("data-theme") === "light";
}

let transitionInFlight = false;

export default function ThemeToggle() {
  const [isLight, setIsLight] = useState(getInitialIsLight);

  const toggle = (e) => {
    if (transitionInFlight) return;

    const nextIsLight = !isLight;
    const x = e.clientX;
    const y = e.clientY;

    const applyDom = () => {
      if (nextIsLight) {
        document.documentElement.setAttribute("data-theme", "light");
      } else {
        document.documentElement.removeAttribute("data-theme");
      }
      localStorage.setItem(STORAGE_KEY, nextIsLight ? "light" : "dark");
    };

    if (!document.startViewTransition) {
      applyDom();
      setIsLight(nextIsLight);
      return;
    }

    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    transitionInFlight = true;
    const transition = document.startViewTransition(applyDom);
    setIsLight(nextIsLight);

    // Safety net: some environments skip invoking the update callback, or
    // never settle transition.finished, leaving the app stuck. Guarantee the
    // DOM/localStorage/lock never desync no matter what the browser does.
    setTimeout(() => {
      const applied = document.documentElement.getAttribute("data-theme") === "light";
      if (applied !== nextIsLight) applyDom();
      transitionInFlight = false;
    }, 300);

    transition.ready
      .then(() => {
        document.documentElement.animate(
          {
            clipPath: [
              `circle(0px at ${x}px ${y}px)`,
              `circle(${endRadius}px at ${x}px ${y}px)`,
            ],
          },
          {
            duration: 550,
            easing: "ease-in-out",
            pseudoElement: "::view-transition-new(root)",
          }
        );
      })
      .catch(() => {});

    transition.finished.catch(() => {});
    transition.updateCallbackDone.catch(() => {});
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isLight ? "Chuyển sang giao diện tối" : "Chuyển sang giao diện sáng"}
      className="w-11 h-11 rounded-full bg-zm-bg hover:bg-zm-hover border border-zm-border flex items-center justify-center text-zm-muted hover:text-zm-blue-light transition-colors"
    >
      {isLight ? <FaMoon size={16} aria-hidden="true" /> : <FaSun size={16} aria-hidden="true" />}
    </button>
  );
}
