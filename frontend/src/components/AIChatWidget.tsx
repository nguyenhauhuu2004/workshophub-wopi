import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bot,
  RotateCcw,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import MarkdownMessage from "@/components/MarkdownMessage";
import { aiService, type ChatMessageItem } from "@/services/aiService";

type Message = {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: string;
};

const INITIAL_SUGGESTIONS = [
  "WoPi là gì?",
  "Cách tìm kiếm & đặt chỗ workshop?",
  "Chính sách thanh toán & check-in?",
  "Làm sao để trở thành Host?",
];

const WELCOME_MESSAGE: Message = {
  id: "welcome-msg",
  role: "model",
  text: "Xin chào! 👋 Mình là **Trợ lý ảo WoPi**.\n\nMình có thể giúp bạn tìm hiểu về các workshop trải nghiệm (làm gốm, vẽ tranh, làm nến thơm...), hướng dẫn đặt chỗ, thanh toán hoặc cách đăng ký làm Host. Bạn cần mình hỗ trợ gì nè?",
  timestamp: new Date().toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  }),
};

export default function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnreadNotice, setHasUnreadNotice] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Cuộn xuống tin nhắn mới nhất
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setHasUnreadNotice(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 200);
    }
  }, [isOpen, messages]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      text,
      timestamp: new Date().toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      // Chuẩn bị history cho Gemini (không bao gồm welcome msg cục bộ nếu không cần)
      const history: ChatMessageItem[] = messages
        .filter((m) => m.id !== "welcome-msg")
        .map((m) => ({
          role: m.role,
          text: m.text,
        }));

      const res = await aiService.chatWithAssistant({
        message: text,
        history,
      });

      const assistantMessage: Message = {
        id: `model-${Date.now()}`,
        role: "model",
        text: res.reply,
        timestamp: new Date().toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("AI Chat error:", error);
      const errorMessage: Message = {
        id: `err-${Date.now()}`,
        role: "model",
        text: "Xin lỗi bạn, hiện tại kết nối đến hệ thống AI đang gặp chút sự cố. Bạn vui lòng thử lại sau giây lát nhé! 🙏",
        timestamp: new Date().toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        ...WELCOME_MESSAGE,
        timestamp: new Date().toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);
    setInputMessage("");
  };


  return (
    <aside aria-label="Trợ lý ảo AI WoPi" className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* 1. Khung Chat Popup */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="mb-4 flex h-[560px] max-h-[82vh] w-[92vw] sm:w-[400px] flex-col overflow-hidden rounded-3xl border border-border bg-background shadow-2xl ring-1 ring-black/5"
          >
            {/* Header của khung chat */}
            <div className="relative flex items-center justify-between border-b border-white/10 bg-gradient-to-r from-[#193a2a] via-[#214c36] to-[#2d6347] px-5 py-4 text-white">
              <div className="flex items-center gap-3">
                <div className="relative flex size-10 items-center justify-center rounded-2xl bg-white/15 text-white shadow-inner backdrop-blur-xs">
                  <Bot className="size-5" />
                  <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-[#193a2a] bg-emerald-400" />
                </div>

                <div>
                  <div className="flex items-center gap-1.5">
                    <h2 className="text-sm font-bold tracking-tight">Trợ lý ảo WoPi</h2>
                    <Sparkles className="size-3.5 text-amber-300 animate-pulse" />
                  </div>
                  <p className="text-[11px] text-emerald-100/80">
                    Sẵn sàng giải đáp 24/7
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleResetChat}
                  title="Bắt đầu đoạn chat mới"
                  className="flex size-8 items-center justify-center rounded-xl text-white/80 transition hover:bg-white/15 hover:text-white"
                >
                  <RotateCcw className="size-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  title="Đóng khung chat"
                  className="flex size-8 items-center justify-center rounded-xl text-white/80 transition hover:bg-white/15 hover:text-white"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            {/* Nội dung tin nhắn cuộn */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm bg-muted/20">
              {messages.map((msg) => {
                const isUser = msg.role === "user";
                return (
                  <div
                    key={msg.id}
                    className={`flex gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}
                  >
                    {!isUser && (
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#214c36] text-white text-xs mt-0.5 shadow-sm">
                        <Bot className="size-4" />
                      </div>
                    )}

                    <div
                      className={`max-w-[82%] rounded-2xl px-4 py-2.5 shadow-xs leading-relaxed ${
                        isUser
                          ? "bg-[#214c36] text-white rounded-tr-xs"
                          : "bg-background border border-border text-foreground/90 rounded-tl-xs"
                      }`}
                    >
                      <MarkdownMessage content={msg.text} isUser={isUser} />
                      <span
                        className={`mt-1 block text-[10px] text-right ${
                          isUser ? "text-emerald-100/70" : "text-muted-foreground"
                        }`}
                      >
                        {msg.timestamp}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Typing indicator */}
              {isLoading && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="flex size-7 items-center justify-center rounded-full bg-[#214c36] text-white text-xs">
                    <Bot className="size-4" />
                  </div>
                  <div className="flex items-center gap-1.5 rounded-2xl border border-border bg-background px-3.5 py-2.5 shadow-xs">
                    <span className="size-1.5 rounded-full bg-[#214c36] animate-bounce [animation-delay:-0.3s]" />
                    <span className="size-1.5 rounded-full bg-[#214c36] animate-bounce [animation-delay:-0.15s]" />
                    <span className="size-1.5 rounded-full bg-[#214c36] animate-bounce" />
                    <span className="ml-1 text-[11px] text-muted-foreground">WoPi đang trả lời...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Gợi ý câu hỏi nhanh (chỉ hiện khi chưa có tin nhắn của người dùng) */}
            {messages.length <= 1 && (
              <div className="border-t border-border/50 bg-background px-3 py-2">
                <p className="mb-1.5 text-[11px] font-medium text-muted-foreground px-1">
                  💡 Gợi ý câu hỏi:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {INITIAL_SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => handleSendMessage(suggestion)}
                      className="rounded-xl border border-border/80 bg-muted/40 px-2.5 py-1 text-xs text-foreground/80 transition hover:border-[#214c36] hover:bg-[#214c36]/5 hover:text-[#214c36]"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Khung nhập tin nhắn */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2 border-t border-border bg-background p-3"
            >
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Hỏi bất cứ điều gì về WoPi..."
                disabled={isLoading}
                className="flex-1 rounded-xl border border-border bg-muted/40 px-3.5 py-2 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-[#214c36] focus:bg-background focus:ring-1 focus:ring-[#214c36]"
              />

              <Button
                type="submit"
                size="icon"
                disabled={!inputMessage.trim() || isLoading}
                className="size-9 shrink-0 rounded-xl bg-[#214c36] text-white hover:bg-[#193a2a] disabled:opacity-40"
              >
                <Send className="size-4" />
              </Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Nút tròn Floating Action Button (FAB) */}
      <motion.button
        type="button"
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        onClick={() => setIsOpen((prev) => !prev)}
        className="group relative flex size-14 items-center justify-center rounded-full bg-gradient-to-tr from-[#193a2a] via-[#214c36] to-[#2e684a] text-white shadow-xl ring-4 ring-white/40 transition hover:shadow-2xl"
        aria-label="Chat với Trợ lý AI WoPi"
      >
        {/* Vòng sáng nhấp nháy thu hút sự chú ý khi chưa mở */}
        {!isOpen && hasUnreadNotice && (
          <span className="absolute -top-1 -right-1 flex size-4">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex size-4 rounded-full bg-emerald-500 border-2 border-white" />
          </span>
        )}

        {isOpen ? (
          <X className="size-6 transition-transform duration-200" />
        ) : (
          <div className="relative">
            <Bot className="size-7" />
            <Sparkles className="absolute -top-1.5 -right-2 size-3.5 text-amber-300" />
          </div>
        )}

        {/* Tooltip hiển thị khi hover */}
        {!isOpen && (
          <span className="pointer-events-none absolute right-full mr-3 whitespace-nowrap rounded-xl bg-[#193a2a] px-3 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition group-hover:opacity-100">
            Chat với Trợ lý ảo WoPi ✨
          </span>
        )}
      </motion.button>
    </aside>
  );
}
