import { createContext, useContext, useEffect, useState } from "react";
import * as friendsApi from "../api/friends";
import { useCurrentUser } from "./UserContext";
import { useWebSocket } from "./WebSocketContext";

const PresenceContext = createContext(null);

export function PresenceProvider({ children }) {
  const { currentUser } = useCurrentUser();
  const { subscribe } = useWebSocket();
  const [onlineFriends, setOnlineFriends] = useState([]);

  useEffect(() => {
    if (!currentUser) {
      setOnlineFriends([]);
      return;
    }
    friendsApi
      .listOnlineFriends()
      .then(setOnlineFriends)
      .catch(() => {});
  }, [currentUser?.id]);

  useEffect(() => {
    if (!currentUser) return;
    return subscribe("/user/queue/presence", (payload) => {
      if (payload.online) {
        friendsApi
          .listOnlineFriends()
          .then(setOnlineFriends)
          .catch(() => {});
      } else {
        setOnlineFriends((prev) => prev.filter((u) => u.id !== payload.userId));
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  return <PresenceContext.Provider value={{ onlineFriends }}>{children}</PresenceContext.Provider>;
}

export function usePresence() {
  const ctx = useContext(PresenceContext);
  if (!ctx) throw new Error("usePresence must be used within a PresenceProvider");
  return ctx;
}
