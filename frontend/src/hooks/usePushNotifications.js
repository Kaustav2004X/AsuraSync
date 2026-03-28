import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "../api";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64   = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw      = window.atob(base64);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

export function usePushNotifications() {
  const [supported,   setSupported]   = useState(false);
  const [permission,  setPermission]  = useState("default");
  const [subscribed,  setSubscribed]  = useState(false);
  const [swReg,       setSwReg]       = useState(null);
  const [loading,     setLoading]     = useState(false);

  // Register service worker and check current state
  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    setSupported(true);
    setPermission(Notification.permission);

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then(async (reg) => {
        setSwReg(reg);
        const existing = await reg.pushManager.getSubscription();
        setSubscribed(!!existing);
      })
      .catch(err => console.error("SW registration failed:", err));
  }, []);

  const subscribe = useCallback(async () => {
    if (!swReg || !VAPID_PUBLIC_KEY) return false;
    setLoading(true);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") return false;

      const sub = await swReg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      await apiFetch("/notifications/subscribe", {
        method: "POST",
        body: JSON.stringify(sub.toJSON()),
      });

      setSubscribed(true);
      return true;
    } catch (err) {
      console.error("Push subscribe failed:", err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [swReg]);

  const unsubscribe = useCallback(async () => {
    if (!swReg) return;
    setLoading(true);
    try {
      const sub = await swReg.pushManager.getSubscription();
      if (sub) {
        await apiFetch("/notifications/unsubscribe", {
          method: "DELETE",
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setSubscribed(false);
    } catch (err) {
      console.error("Push unsubscribe failed:", err);
    } finally {
      setLoading(false);
    }
  }, [swReg]);

  const sendTest = useCallback(async () => {
    try {
      await apiFetch("/notifications/test", { method: "POST" });
      return true;
    } catch {
      return false;
    }
  }, []);

  return { supported, permission, subscribed, loading, subscribe, unsubscribe, sendTest };
}