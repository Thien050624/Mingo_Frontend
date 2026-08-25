import { createContext, useContext, useEffect, useState } from "react";
import * as notificationsApi from "../api/notifications";
import { useCurrentUser } from "./UserContext";
import { useWebSocket } from "./WebSocketContext";

const NotificationContext = createContext(null);
// WebSocket delivers new notifications instantly; this is just a safety-net refresh
// in case a push is missed (e.g. brief disconnect during reconnect).
const POLL_INTERVAL_MS = 60000;

export function NotificationProvider({ children }) {
  const { currentUser } = useCurrentUser();
  const { subscribe } = useWebSocket();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    notificationsApi
      .list()
      .then((page) => setNotifications(page.content.map(notificationsApi.toFrontendNotification)))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!currentUser) {
      setNotifications([]);
      setLoading(false);
      return;
    }
    load();
    const interval = setInterval(load, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  useEffect(() => {
    if (!currentUser) return;
    return subscribe("/user/queue/notifications", (payload) => {
      const mapped = notificationsApi.toFrontendNotification(payload);
      setNotifications((prev) => (prev.some((n) => n.id === mapped.id) ? prev : [mapped, ...prev]));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  const markRead = async (id) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, unread: false } : n)));
    try {
      await notificationsApi.markAsRead(id);
    } catch (err) {
      console.error("Không thể đánh dấu đã đọc:", err);
    }
  };

  const markAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    try {
      await notificationsApi.markAllAsRead();
    } catch (err) {
      console.error("Không thể đánh dấu tất cả đã đọc:", err);
    }
  };

  const deleteNotification = async (id) => {
    const previous = notifications;
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    try {
      await notificationsApi.remove(id);
    } catch (err) {
      console.error("Không thể xoá thông báo:", err);
      setNotifications(previous);
    }
  };

  const deleteAllNotifications = async () => {
    const previous = notifications;
    setNotifications([]);
    try {
      await notificationsApi.removeAll();
    } catch (err) {
      console.error("Không thể xoá tất cả thông báo:", err);
      setNotifications(previous);
    }
  };

  return (
    <NotificationContext.Provider
      value={{ notifications, loading, markRead, markAllRead, deleteNotification, deleteAllNotifications }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used within a NotificationProvider");
  return ctx;
}
