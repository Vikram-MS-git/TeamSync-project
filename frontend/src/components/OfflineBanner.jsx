// frontend/src/components/OfflineBanner.jsx
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useIsOnline } from "../context/TasksContext.jsx";
import { syncNow } from "../db/tasksSync.js";

export function OfflineBanner() {
  const isOnline = useIsOnline();
  const [justReconnected, setJustReconnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState(null);

  useEffect(() => {
    if (isOnline) {
      setJustReconnected(true);
      const timer = setTimeout(() => {
        setJustReconnected(false);
      }, 4000);
      return () => clearTimeout(timer);
    } else {
      setJustReconnected(false);
    }
  }, [isOnline]);

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      await syncNow();
      setSyncMessage("Synchronized successfully");
      setTimeout(() => setSyncMessage(null), 3000);
    } catch {
      setSyncMessage("Sync error. Will retry automatically.");
      setTimeout(() => setSyncMessage(null), 3000);
    } finally {
      setIsSyncing(false);
    }
  };

  const showBanner = !isOnline || justReconnected || syncMessage;

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -40 }}
          transition={{ duration: 0.3 }}
          role="status"
          aria-live="polite"
          style={{
            position: "fixed",
            top: 16,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "8px 18px",
            borderRadius: 30,
            fontSize: 12.5,
            fontWeight: 500,
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.4)",
            background: !isOnline
              ? "rgba(234, 88, 12, 0.92)"
              : "rgba(16, 185, 129, 0.92)",
            color: "#ffffff",
            border: !isOnline
              ? "1px solid rgba(255, 255, 255, 0.25)"
              : "1px solid rgba(255, 255, 255, 0.25)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 15 }}>
              {!isOnline ? "⚡" : "✓"}
            </span>
            <span>
              {!isOnline
                ? "Offline Mode — Changes saved to PouchDB and will sync upon reconnection."
                : syncMessage || "Connected — Reconciling offline changes with server..."}
            </span>
          </div>

          {isOnline && (
            <button
              type="button"
              onClick={handleManualSync}
              disabled={isSyncing}
              style={{
                background: "rgba(255, 255, 255, 0.2)",
                border: "1px solid rgba(255, 255, 255, 0.4)",
                color: "#fff",
                padding: "3px 10px",
                borderRadius: 14,
                fontSize: 11.5,
                fontWeight: 600,
                cursor: isSyncing ? "wait" : "pointer",
              }}
            >
              {isSyncing ? "Syncing..." : "Sync Now"}
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default OfflineBanner;
