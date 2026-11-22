// frontend/src/components/TeamChat.jsx
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext.jsx";
import { useSocket } from "../context/SocketContext.jsx";
import { fetchBoardMessages, sendBoardMessage } from "../api/chat.js";
import UserAvatar from "./UserAvatar.jsx";
import "../styles/teamChat.css";

function formatMessageTime(dateStr) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

export default function TeamChat({ boardId, boardName, onClose, members = [] }) {
  const { user } = useAuth();
  const { socket, isConnected } = useSocket() || {};
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    if (typeof messagesEndRef.current?.scrollIntoView === "function") {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Fetch initial message history
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    fetchBoardMessages(boardId)
      .then((data) => {
        if (!cancelled && Array.isArray(data)) {
          setMessages(data);
        }
      })
      .catch((err) => {
        console.error("Failed to load chat messages:", err);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [boardId]);

  // Scroll to bottom on initial load and message updates
  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Listen for real-time incoming messages via Socket.IO
  useEffect(() => {
    if (!socket) return;

    const handleIncomingMessage = (newMsg) => {
      if (!newMsg || newMsg.boardId !== boardId) return;

      setMessages((prev) => {
        // Prevent duplicate if already received or added optimistically
        if (prev.some((m) => m.id === newMsg.id)) {
          return prev;
        }
        return [...prev, newMsg];
      });
    };

    socket.on("chat:message", handleIncomingMessage);

    return () => {
      socket.off("chat:message", handleIncomingMessage);
    };
  }, [socket, boardId]);

  const handleSendMessage = async (e) => {
    e?.preventDefault?.();
    const trimmed = text.trim();
    if (!trimmed || isSending) return;

    setIsSending(true);
    setText("");

    try {
      // Primary route: WebSocket emission with callback acknowledgment
      if (socket && isConnected) {
        socket.emit(
          "chat:message",
          { boardId, message: trimmed },
          (response) => {
            if (response?.error) {
              console.error("Socket chat error, attempting REST fallback:", response.error);
              sendBoardMessage(boardId, trimmed).catch(console.error);
            }
          }
        );
      } else {
        // Fallback route: REST POST
        const saved = await sendBoardMessage(boardId, trimmed);
        setMessages((prev) => {
          if (prev.some((m) => m.id === saved.id)) return prev;
          return [...prev, saved];
        });
      }
    } catch (err) {
      console.error("Failed to send chat message:", err);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      <motion.div
        className="team-chat-backdrop"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        aria-hidden="true"
      />

      <motion.aside
        className="team-chat-drawer"
        role="dialog"
        aria-label="Team Chat"
        initial={{ x: "100%", opacity: 0.5 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: "100%", opacity: 0 }}
        transition={{ type: "spring", stiffness: 350, damping: 35 }}
      >
        {/* Header */}
        <div className="team-chat-header">
          <div className="team-chat-header__info">
            <div className="team-chat-header__title-row">
              <h3 className="team-chat-header__title">
                <svg
                  className="team-chat-header__icon"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                Team Chat
              </h3>
              <span className="team-chat-header__status">
                <span
                  className="team-chat-header__status-dot"
                  style={{ background: isConnected ? "#4ade80" : "#f59e0b" }}
                />
                {isConnected ? "Live" : "Connecting..."}
              </span>
            </div>
            {boardName && (
              <span className="team-chat-header__board-badge" title={boardName}>
                #{boardName}
              </span>
            )}
          </div>

          <button
            type="button"
            className="team-chat-header__close-btn"
            onClick={onClose}
            aria-label="Close Team Chat"
            title="Close"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Message Feed */}
        <div className="team-chat-messages">
          {isLoading ? (
            <div className="team-chat-loading">Loading conversations...</div>
          ) : messages.length === 0 ? (
            <div className="team-chat-empty">
              <div className="team-chat-empty__icon-box">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                </svg>
              </div>
              <h4 className="team-chat-empty__title">No messages yet</h4>
              <p className="team-chat-empty__text">
                Start real-time collaboration with your team members on this project.
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.senderId === user?.id;
              const senderMember = members.find((m) => m.id === msg.senderId);

              return (
                <div
                  key={msg.id || `${msg.senderId}-${msg.createdAt}`}
                  className={`team-chat-message-row ${
                    isMe ? "team-chat-message-row--me" : "team-chat-message-row--peer"
                  }`}
                >
                  {!isMe && (
                    <UserAvatar
                      user={senderMember}
                      name={msg.senderName}
                      size={28}
                      className="team-chat-avatar"
                    />
                  )}

                  <div className="team-chat-message-content">
                    {!isMe && (
                      <div className="team-chat-message-sender-meta">
                        <span className="team-chat-message-sender-name">{msg.senderName}</span>
                        <span className="team-chat-message-time">{formatMessageTime(msg.createdAt)}</span>
                      </div>
                    )}

                    <div className="team-chat-bubble">
                      {msg.message}
                      {isMe && (
                        <span className="team-chat-bubble__footer-time">
                          {formatMessageTime(msg.createdAt)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Footer / Input */}
        <form className="team-chat-footer" onSubmit={handleSendMessage}>
          <div className="team-chat-input-box">
            <textarea
              className="team-chat-textarea"
              placeholder="Type a message..."
              rows={1}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isSending}
              aria-label="Chat message input"
            />
            <button
              type="submit"
              className="team-chat-send-btn"
              disabled={!text.trim() || isSending}
              aria-label="Send message"
              title="Send message"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
          <div className="team-chat-shortcut-hint">
            Press <kbd>Enter</kbd> to send, <kbd>Shift + Enter</kbd> for new line
          </div>
        </form>
      </motion.aside>
    </>
  );
}
