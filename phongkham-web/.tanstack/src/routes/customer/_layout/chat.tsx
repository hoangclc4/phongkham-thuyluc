import { createFileRoute } from '@tanstack/react-router';
import { useState, useRef, useEffect } from 'react';
import { useChatMutation } from '@/hooks/use-customer-portal';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/cn';
import { Send } from 'lucide-react';
import type { ChatMessage } from '@/types/ai';

const SESSION_ID_KEY = 'ai_chat_session_id';

const DISCLAIMER =
  'Đây là thông tin tham khảo. Để được chẩn đoán chính xác, xin mang bé đến trực tiếp Phòng Khám Thú Y Bác Sĩ Lục tại 990 Huỳnh Tấn Phát, Tân Mỹ, TP.HCM. SĐT: 028 3873 0496';

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    role: 'assistant',
    content:
      'Xin chào! Tôi là trợ lý AI của Phòng Khám Thú Y Bác Sĩ Lục. Tôi có thể giúp bạn giải thích thông tin bệnh lý, hỏi thăm tình trạng thú cưng và hỗ trợ đặt lịch. Bạn cần hỗ trợ gì?',
  },
];

export const Route = createFileRoute('/customer/_layout/chat')({
  component: CustomerChatPage,
});

function CustomerChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const chatMutation = useChatMutation();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage() {
    const trimmed = input.trim();
    if (!trimmed || chatMutation.isPending) return;

    const sessionId = sessionStorage.getItem(SESSION_ID_KEY) ?? undefined;

    setMessages((prev) => [...prev, { role: 'user', content: trimmed }]);
    setInput('');

    const response = await chatMutation.mutateAsync({ message: trimmed, sessionId });

    if (!sessionStorage.getItem(SESSION_ID_KEY)) {
      sessionStorage.setItem(SESSION_ID_KEY, response.sessionId);
    }

    setMessages((prev) => [...prev, { role: 'assistant', content: response.reply }]);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 bg-white">
        <p className="text-sm font-semibold text-gray-700">🐾 Trợ lý AI</p>
        <p className="text-xs text-gray-400 mt-0.5">Tư vấn thông tin — không thay thế chẩn đoán bác sĩ</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg, idx) => (
          <MessageBubble key={idx} message={msg} />
        ))}

        {chatMutation.isPending && (
          <div className="flex gap-2 justify-start">
            <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
              <Spinner size="sm" />
              <span className="text-sm text-gray-500">Đang trả lời...</span>
            </div>
          </div>
        )}

        {chatMutation.isError && (
          <div className="text-center">
            <p className="text-xs text-red-500">Không thể gửi tin nhắn. Vui lòng thử lại.</p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Disclaimer */}
      <div className="px-4 py-2 bg-amber-50 border-t border-amber-100">
        <p className="text-xs text-amber-700 leading-snug">{DISCLAIMER}</p>
      </div>

      {/* Input */}
      <div className="px-4 py-3 bg-white border-t border-gray-200">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nhập câu hỏi..."
            rows={1}
            className="flex-1 resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent min-h-[48px] max-h-32"
            style={{ overflow: 'auto' }}
          />
          <Button
            type="button"
            size="icon"
            onClick={sendMessage}
            disabled={!input.trim() || chatMutation.isPending}
            className="h-12 w-12 shrink-0 rounded-xl"
            aria-label="Gửi tin nhắn"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-gray-400 mt-1.5 text-center">
          Enter để gửi • Shift+Enter xuống dòng
        </p>
      </div>
    </div>
  );
}

interface MessageBubbleProps {
  message: ChatMessage;
}

function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  return (
    <div className={cn('flex gap-2', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
        <div className="h-8 w-8 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white text-sm shrink-0 mt-1">
          🐾
        </div>
      )}
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap',
          isUser
            ? 'bg-[var(--color-primary)] text-white rounded-tr-sm'
            : 'bg-gray-100 text-gray-900 rounded-tl-sm',
        )}
      >
        {message.content}
      </div>
    </div>
  );
}
