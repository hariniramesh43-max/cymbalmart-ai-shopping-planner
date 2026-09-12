import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Bot,
  User,
  Sparkles,
  Maximize2,
  Minimize2,
  ChevronDown,
  RotateCcw,
  PlusCircle,
  Check,
} from 'lucide-react';
import { ChatMessage, PartyPlan, ShoppingItem } from '../types/party';
import { sendCymbalMartAssistantChat } from '../services/partyApi';

interface FloatingAssistantWidgetProps {
  partyPlan: PartyPlan | null;
  onAddItem?: (item: ShoppingItem) => void;
  onOpenFullChatTab: () => void;
}

const QUICK_QUESTIONS = [
  'Where is ice located?',
  'How much drinks for my guests?',
  'Recommend 2 budget dips',
  'Store hours & pickup',
];

export const FloatingAssistantWidget: React.FC<FloatingAssistantWidgetProps> = ({
  partyPlan,
  onAddItem,
  onOpenFullChatTab,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'floating-welcome',
      role: 'assistant',
      content: `Hi there! 👋 Need shopping advice, aisle directions, or party portion calculations? I'm your **CymbalMart Assistant**!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      setHasUnread(false);
    }
  }, [isOpen, messages]);

  const handleSend = async (textToSend?: string) => {
    const messageContent = textToSend || input.trim();
    if (!messageContent || isSending) return;

    const userMsg: ChatMessage = {
      id: `user-f-${Date.now()}`,
      role: 'user',
      content: messageContent,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setIsSending(true);

    try {
      const reply = await sendCymbalMartAssistantChat([...messages, userMsg], partyPlan);
      const assistantMsg: ChatMessage = {
        id: `ai-f-${Date.now()}`,
        role: 'assistant',
        content: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      if (!isOpen) {
        setHasUnread(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed bottom-14 right-5 z-40">
      {/* Floating Chat Modal / Drawer */}
      {isOpen && (
        <div className="w-[360px] sm:w-[410px] h-[520px] bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden mb-3 animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="bg-teal-700 text-white p-3.5 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center text-white">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-xs">CymbalMart Assistant</h3>
                <p className="text-[10px] text-teal-100">Live Customer Concierge</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={onOpenFullChatTab}
                className="p-1.5 hover:bg-white/10 rounded-lg text-teal-100 hover:text-white transition-colors cursor-pointer"
                title="Expand to Full View"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/10 rounded-lg text-teal-100 hover:text-white transition-colors cursor-pointer"
                title="Minimize"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div className="flex-1 p-3.5 bg-slate-50 overflow-y-auto space-y-3">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <div
                    className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 text-[10px] ${
                      isUser ? 'bg-slate-900 text-white' : 'bg-teal-600 text-white'
                    }`}
                  >
                    {isUser ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                  </div>
                  <div
                    className={`max-w-[85%] rounded-xl px-3 py-2 text-[11px] leading-relaxed ${
                      isUser
                        ? 'bg-slate-900 text-white rounded-tr-none font-medium'
                        : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-xs whitespace-pre-wrap'
                    }`}
                  >
                    {msg.content}
                    <div
                      className={`text-[8px] mt-1 ${
                        isUser ? 'text-slate-300 text-right' : 'text-slate-400'
                      }`}
                    >
                      {msg.timestamp}
                    </div>
                  </div>
                </div>
              );
            })}

            {isSending && (
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-md bg-teal-600 text-white flex items-center justify-center shrink-0">
                  <Bot className="w-3 h-3" />
                </div>
                <div className="bg-white border border-slate-200 rounded-xl rounded-tl-none px-3 py-2 text-[11px] text-slate-500 flex items-center gap-1.5 shadow-xs">
                  <div className="w-1.5 h-1.5 rounded-full bg-teal-600 animate-bounce" />
                  <div className="w-1.5 h-1.5 rounded-full bg-teal-600 animate-bounce [animation-delay:0.2s]" />
                  <div className="w-1.5 h-1.5 rounded-full bg-teal-600 animate-bounce [animation-delay:0.4s]" />
                  <span className="text-[10px]">Checking CymbalMart store info...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Chips */}
          <div className="bg-white border-t border-slate-100 p-2 flex items-center gap-1.5 overflow-x-auto">
            {QUICK_QUESTIONS.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q)}
                className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 hover:bg-teal-50 text-slate-600 hover:text-teal-800 border border-slate-200 hover:border-teal-200 whitespace-nowrap shrink-0 transition-colors cursor-pointer"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <div className="p-2.5 bg-white border-t border-slate-200 flex items-center gap-1.5">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask CymbalMart Assistant..."
              className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isSending}
              className="p-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Floating Trigger Launcher Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2.5 px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-full shadow-lg shadow-teal-700/30 font-semibold text-xs transition-all hover:scale-105 active:scale-95 cursor-pointer border border-teal-600/50 group"
          aria-label="Open CymbalMart Assistant"
        >
          <div className="relative">
            <Bot className="w-4 h-4 text-teal-100 group-hover:text-white transition-colors" />
            {hasUnread && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            )}
          </div>
          <span className="whitespace-nowrap">Ask CymbalMart Assistant</span>
        </button>
      )}
    </div>
  );
};
