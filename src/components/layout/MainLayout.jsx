import { Outlet, useLocation } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";
import RightPanel from "./RightPanel";
import MobileBottomNav from "./MobileBottomNav";
import ChatBubble from "../chat/ChatBubble";

const NO_RIGHT_PANEL_PREFIXES = ["/chat", "/forum", "/profile", "/friends", "/notifications", "/saved"];

export default function MainLayout() {
  const location = useLocation();
  const hideRightPanel = NO_RIGHT_PANEL_PREFIXES.some((prefix) => location.pathname.startsWith(prefix));

  return (
    <div className="min-h-screen bg-zm-bg bg-noise">
      <Header />
      <div className="pt-14 max-w-[1200px] mx-auto flex gap-4 px-2 sm:px-4">
        <Sidebar />
        <main className="flex-1 min-w-0 py-4 pb-20 lg:pb-4">
          <Outlet />
        </main>
        {!hideRightPanel && <RightPanel />}
      </div>
      <MobileBottomNav />
      <div className="hidden lg:block">
        <ChatBubble />
      </div>
    </div>
  );
}
