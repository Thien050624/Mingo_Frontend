import { Routes, Route } from "react-router-dom";
import MainLayout from "./components/layout/MainLayout";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import Chat from "./pages/Chat";
import Notifications from "./pages/Notifications";
import Friends from "./pages/Friends";
import SearchResults from "./pages/SearchResults";
import Forum from "./pages/Forum";
import ForumRooms from "./pages/ForumRooms";
import Saved from "./pages/Saved";
import Settings from "./pages/Settings";
import SettingsAccount from "./pages/SettingsAccount";
import SettingsProfile from "./pages/SettingsProfile";
import Login from "./pages/Login";
import Onboarding from "./pages/Onboarding";
import NotFound from "./pages/NotFound";
import { UserProvider } from "./context/UserContext";
import { RequireAuth, RedirectIfAuthed } from "./components/auth/RouteGuards";
import { ChatProvider } from "./context/ChatContext";
import { NotificationProvider } from "./context/NotificationContext";
import { SavedProvider } from "./context/SavedContext";
import { ToastProvider } from "./context/ToastContext";
import { WebSocketProvider } from "./context/WebSocketContext";
import { PresenceProvider } from "./context/PresenceContext";

export default function App() {
  return (
    <ToastProvider>
    <UserProvider>
      <WebSocketProvider>
      <PresenceProvider>
        <ChatProvider>
          <NotificationProvider>
            <SavedProvider>
              <Routes>
                <Route
                  path="/login"
                  element={
                    <RedirectIfAuthed>
                      <Login />
                    </RedirectIfAuthed>
                  }
                />
                <Route
                  path="/onboarding"
                  element={
                    <RequireAuth requireOnboarded={false}>
                      <Onboarding />
                    </RequireAuth>
                  }
                />
                <Route
                  element={
                    <RequireAuth>
                      <MainLayout />
                    </RequireAuth>
                  }
                >
                  <Route path="/" element={<Home />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/profile/:userId" element={<Profile />} />
                  <Route path="/chat" element={<Chat />} />
                  <Route path="/notifications" element={<Notifications />} />
                  <Route path="/friends" element={<Friends />} />
                  <Route path="/search" element={<SearchResults />} />
                  <Route path="/forum" element={<ForumRooms />} />
                  <Route path="/forum/:roomId" element={<Forum />} />
                  <Route path="/saved" element={<Saved />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/settings/account" element={<SettingsAccount />} />
                  <Route path="/settings/profile" element={<SettingsProfile />} />
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Routes>
            </SavedProvider>
          </NotificationProvider>
        </ChatProvider>
      </PresenceProvider>
      </WebSocketProvider>
    </UserProvider>
    </ToastProvider>
  );
}
