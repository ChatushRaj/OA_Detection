import { useState, useRef, useEffect, useCallback } from "react";
import { sendChatMessage } from "../services/api";
import { MessageCircle, X, Send, Bot, User, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ChatMsg {
  role: "user" | "bot";
  text: string;
  time: string;
}

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([
    { role: "bot", text: "Hello! 👋 I'm your **OA Detection Assistant**. Ask me about osteoarthritis, scan results, grades, treatment, or how to use this portal!", time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open]);

  const handleSend = useCallback(async () => {
    const msg = input.trim();
    if (!msg || loading) return;

    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setMessages((m) => [...m, { role: "user", text: msg, time: now }]);
    setInput("");
    setLoading(true);

    try {
      const res = await sendChatMessage(msg);
      const botTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      setMessages((m) => [...m, { role: "bot", text: res.reply, time: botTime }]);
    } catch {
      const botTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      setMessages((m) => [...m, { role: "bot", text: "Sorry, I'm having trouble connecting. Please try again.", time: botTime }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const renderText = (text: string) => {
    return text.split("\n").map((line, i) => {
      const parts = line.split(/(\*\*[^*]+\*\*)/g).map((part, j) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={j} style={{ color: "inherit", fontWeight: 800 }}>{part.slice(2, -2)}</strong>;
        }
        return <span key={j}>{part}</span>;
      });
      return <div key={i} style={{ minHeight: line === "" ? "8px" : "auto" }}>{parts}</div>;
    });
  };

  return (
    <>
      {/* Floating button */}
      <motion.button 
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="chat-fab" 
        onClick={() => setOpen(!open)} 
        title="AI Assistant"
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.div key="x" initial={{ opacity: 0, rotate: -90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: 90 }}>
              <X size={24} />
            </motion.div>
          ) : (
            <motion.div key="msg" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}>
              <MessageCircle size={24} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Chat window */}
      <AnimatePresence>
        {open && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
            className="chat-window"
          >
            <div className="chat-header">
              <div className="chat-header-left">
                <div className="bot-avatar"><Sparkles size={18} strokeWidth={2.5} /></div>
                <div>
                  <div className="chat-title">OA Assistant</div>
                  <div className="chat-status"><span className="status-dot"></span> Online</div>
                </div>
              </div>
              <button className="chat-close" onClick={() => setOpen(false)}><X size={18} /></button>
            </div>

            <div className="chat-messages">
              {messages.map((m, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`msg ${m.role}`}
                >
                  <div className="msg-icon">
                    {m.role === "bot" ? <Bot size={14} /> : <User size={14} />}
                  </div>
                  <div className="msg-bubble shadow-sm">
                    <div className="msg-text">{renderText(m.text)}</div>
                    <div className="msg-time">{m.time}</div>
                  </div>
                </motion.div>
              ))}
              {loading && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="msg bot">
                  <div className="msg-icon"><Bot size={14} /></div>
                  <div className="msg-bubble">
                    <div className="typing-dots"><span></span><span></span><span></span></div>
                  </div>
                </motion.div>
              )}
              <div ref={bottomRef} />
            </div>

            <div className="chat-input-area">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Ask about OA, grades, treatment..."
                disabled={loading}
              />
              <button className="send-btn" onClick={handleSend} disabled={!input.trim() || loading}>
                <Send size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .chat-header { 
          display: flex; 
          align-items: center; 
          justify-content: space-between; 
          padding: 20px 24px; 
          background: var(--surface-container-low); 
          border-bottom: 1px solid var(--outline-variant); 
          backdrop-filter: blur(10px);
        }
        .chat-header-left { display: flex; align-items: center; gap: 14px; }
        .bot-avatar { 
          width: 40px; 
          height: 40px; 
          border-radius: 12px; 
          background: var(--primary); 
          color: var(--on-primary); 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          box-shadow: 0 6px 16px -4px var(--primary-dim);
        }
        .chat-title { color: var(--on-surface); font-size: 1rem; font-weight: 800; letter-spacing: -0.02em; }
        .chat-status { 
          color: var(--on-surface-variant); 
          font-size: 0.75rem; 
          font-weight: 700; 
          display: flex; 
          align-items: center; 
          gap: 6px; 
          margin-top: 2px;
        }
        .status-dot { width: 6px; height: 6px; background: var(--primary); border-radius: 50%; }
        .chat-close { background: var(--surface-container-high); border: 1px solid var(--outline-variant); color: var(--on-surface-variant); cursor: pointer; padding: 6px; border-radius: 10px; transition: all 0.2s; }
        .chat-close:hover { background: var(--error-container); color: var(--on-error-container); border-color: var(--error-container); }

        .chat-messages { flex: 1; overflow-y: auto; padding: 24px; display: flex; flex-direction: column; gap: 18px; min-height: 400px; max-height: 480px; }
        .chat-messages::-webkit-scrollbar { width: 4px; }
        .chat-messages::-webkit-scrollbar-thumb { background: var(--outline-variant); border-radius: 10px; }

        .msg { display: flex; gap: 12px; align-items: flex-end; }
        .msg.user { flex-direction: row-reverse; }
        .msg-icon { 
          width: 32px; 
          height: 32px; 
          border-radius: 10px; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          flex-shrink: 0; 
          background: var(--surface-container-low);
          border: 1px solid var(--outline-variant);
        }
        .msg.bot .msg-icon { color: var(--primary); }
        .msg.user .msg-icon { color: var(--secondary); }

        .msg-bubble { max-width: 85%; padding: 14px 18px; position: relative; }
        .msg.bot .msg-bubble { 
          background: var(--surface-container-high); 
          border: 1px solid var(--outline-variant); 
          border-radius: 18px 18px 18px 4px; 
          color: var(--on-surface);
        }
        .msg.user .msg-bubble { 
          background: var(--primary-container); 
          border-radius: 18px 18px 4px 18px; 
          color: var(--on-primary-container);
        }

        .msg-text { font-size: 0.92rem; line-height: 1.6; }
        .msg.user .msg-text { font-weight: 500; }
        .msg-time { 
          font-size: 0.65rem; 
          font-weight: 600; 
          margin-top: 6px; 
          opacity: 0.7; 
          text-transform: uppercase; 
          letter-spacing: 0.02em;
        }
        .msg.user .msg-time { text-align: left; }
        .msg.bot .msg-time { text-align: right; }

        .typing-dots { display: flex; gap: 5px; padding: 6px 4px; }
        .typing-dots span { width: 7px; height: 7px; background: var(--outline); border-radius: 50%; animation: typeBounce 1.4s infinite; }
        .typing-dots span:nth-child(2) { animation-delay: 0.2s; }
        .typing-dots span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes typeBounce { 0%, 80%, 100% { transform: translateY(0); } 40% { transform: translateY(-7px); } }

        .chat-input-area { 
          display: flex; 
          gap: 12px; 
          padding: 18px 24px 24px; 
          border-top: 1px solid var(--outline-variant); 
          background: var(--surface-container-lowest); 
        }
        .chat-input-area input { 
          flex: 1; 
          padding: 14px 18px; 
          border-radius: 16px; 
          border: 1.5px solid var(--outline-variant); 
          background: var(--surface-container-low); 
          color: var(--on-surface); 
          font-size: 0.95rem; 
          outline: none; 
          font-family: inherit; 
          transition: all 0.2s;
        }
        .chat-input-area input:focus { 
          border-color: var(--primary); 
          background: var(--surface-container-lowest); 
        }
        .send-btn { 
          width: 48px; 
          height: 48px; 
          border-radius: 16px; 
          border: none; 
          background: var(--primary); 
          color: var(--on-primary); 
          cursor: pointer; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          transition: all 0.2s; 
          flex-shrink: 0; 
        }
        .send-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        .send-btn:hover:not(:disabled) { transform: translateY(-2px); filter: brightness(1.1); }
      `}</style>
    </>
  );
}
