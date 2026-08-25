import { createContext, useContext, useEffect, useRef, useState } from "react";
import { Client } from "@stomp/stompjs";
import { useCurrentUser } from "./UserContext";

const WebSocketContext = createContext(null);
const ACCESS_TOKEN_KEY = "mingo-access-token";
const WS_URL = (import.meta.env.VITE_API_URL || "http://localhost:8080").replace(/^http/, "ws") + "/ws";

export function WebSocketProvider({ children }) {
  const { currentUser } = useCurrentUser();
  const clientRef = useRef(null);
  const pendingRef = useRef([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      clientRef.current?.deactivate();
      clientRef.current = null;
      pendingRef.current = [];
      setConnected(false);
      return;
    }

    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    const client = new Client({
      brokerURL: WS_URL,
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      onConnect: () => {
        setConnected(true);
        pendingRef.current.forEach((entry) => {
          entry.sub = client.subscribe(entry.destination, (msg) => entry.callback(JSON.parse(msg.body)));
        });
      },
      onWebSocketClose: () => setConnected(false),
    });
    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
      clientRef.current = null;
      pendingRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  const subscribe = (destination, callback) => {
    const entry = { destination, callback, sub: null };
    pendingRef.current.push(entry);
    if (clientRef.current?.connected) {
      entry.sub = clientRef.current.subscribe(destination, (msg) => callback(JSON.parse(msg.body)));
    }
    return () => {
      entry.sub?.unsubscribe();
      pendingRef.current = pendingRef.current.filter((e) => e !== entry);
    };
  };

  const publish = (destination, body) => {
    if (!clientRef.current?.connected) return;
    clientRef.current.publish({ destination, body: JSON.stringify(body) });
  };

  return (
    <WebSocketContext.Provider value={{ connected, subscribe, publish }}>{children}</WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const ctx = useContext(WebSocketContext);
  if (!ctx) throw new Error("useWebSocket must be used within a WebSocketProvider");
  return ctx;
}
