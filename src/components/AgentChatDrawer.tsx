import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Bot,
  User,
  Lightbulb,
  PlusCircle,
  Check,
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Store,
  Clock,
  MapPin,
  Tag,
  HelpCircle,
} from 'lucide-react';
import { ChatMessage, PartyPlan, ShoppingItem } from '../types/party';
import { sendCymbalMartAssistantChat } from '../services/partyApi';

interface AgentChatDrawerProps {
  partyPlan: PartyPlan | null;
  onAddItemFromChat?: (item: ShoppingItem) => void;
}

const CATEGORIZED_PROMPTS = [
  {
    category: 'Party Planning',
    prompts: [
      'How much ice and drinks do I need for my head count?',
      'Suggest 2 crowd-pleasing gluten-free snacks from Cymbal Fresh.',
      'How can I save $25 on this party without guests noticing?',
    ],
  },
  {
    category: 'Store & Services',
    prompts: [
      'What are today’s store hours and curbside pickup guidelines?',
      'Which aisle has compostable plates and napkins?',
      'How does the 100% Freshness Guarantee and return policy work?',
    ],
  },
];

export const AgentChatDrawer: React.FC<AgentChatDrawerProps> = ({
  partyPlan,
  onAddItemFromChat,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hello! 👋 I am your **CymbalMart Assistant**.\n\nI can help you plan your party shopping list, calculate exact food and drink ratios for ${
        partyPlan?.guestCount || 16
      } guests, find aisles in your local CymbalMart store, verify store policies, or find budget-saving swaps with **Cymbal Basics** and **Cymbal Fresh**.\n\nHow can I help you today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [feedbackMap, setFeedbackMap] = useState<Record<string, 'up' | 'down'>>({});
  const [addedItemIds, setAddedItemIds] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (textToSend?: string) => {
    const messageContent = textToSend || input.trim();
    if (!messageContent || isSending) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
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
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'welcome-reset',
        role: 'assistant',
        content: `Chat cleared. Hello! I'm your **CymbalMart Assistant**. Ask me anything about store aisles, party budgeting, ingredient portions, or item recommendations.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRateFeedback = (msgId: string, rating: 'up' | 'down') => {
    setFeedbackMap((prev) => ({ ...prev, [msgId]: rating }));
  };

  // Quick item addition parser
  const handleQuickAddSuggestedItem = (
    name: string,
    brand: string,
    dept: any,
    aisle: string,
    price: number,
    key: string
  ) => {
    if (onAddItemFromChat) {
      const item: ShoppingItem = {
        id: `chat-add-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        name,
        brand,
        department: dept || 'food',
        aisle,
        unitPrice: price,
        quantity: 1,
        packageSize: '1 unit',
        whyNeeded: 'Added from CymbalMart Assistant recommendation',
        checked: false,
      };
      onAddItemFromChat(item);
      setAddedItemIds((prev) => ({ ...prev, [key]: true }));
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 h-[calc(100vh-8.5rem)] flex flex-col">
      {/* Header Bar */}
      <div className="bg-white border border-slate-200 rounded-t-2xl p-4 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-teal-600 rounded-xl flex items-center justify-center text-white shadow-xs">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-sm text-slate-900">CymbalMart Assistant</h2>
              <span className="bg-teal-50 text-teal-700 border border-teal-200 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                AI Customer Concierge
              </span>
            </div>
            <p className="text-[11px] text-slate-500 truncate max-w-md">
              Store #{104} Flagship • Context: {partyPlan?.title || 'Party & Grocery Planning'} ({partyPlan?.guestCount || 16} guests, ${partyPlan?.targetBudget || 200} budget)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleClearChat}
            title="Reset Chat"
            className="flex items-center gap-1 text-slate-500 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>

      {/* Message Stream */}
      <div className="flex-1 bg-slate-50 border-x border-slate-200 p-4 overflow-y-auto space-y-4">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs ${
                  isUser
                    ? 'bg-slate-900 text-white font-bold'
                    : 'bg-teal-600 text-white shadow-xs'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-[85%] sm:max-w-[78%] rounded-2xl px-4 py-3.5 text-xs leading-relaxed ${
                  isUser
                    ? 'bg-slate-900 text-white font-medium rounded-tr-none shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-xs'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>

                {/* Assistant Message Footer Actions */}
                {!isUser && (
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="text-[10px]">{msg.timestamp}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopyMessage(msg.id, msg.content)}
                        className="hover:text-slate-600 transition-colors p-1 rounded-md hover:bg-slate-100 cursor-pointer flex items-center gap-1"
                        title="Copy message"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3 h-3 text-teal-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        <span className="text-[10px]">{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                      </button>

                      <div className="flex items-center gap-1 pl-1 border-l border-slate-200">
                        <button
                          onClick={() => handleRateFeedback(msg.id, 'up')}
                          className={`p-1 rounded-md hover:bg-slate-100 transition-colors cursor-pointer ${
                            feedbackMap[msg.id] === 'up' ? 'text-teal-600 font-bold' : ''
                          }`}
                          title="Helpful response"
                        >
                          <ThumbsUp className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleRateFeedback(msg.id, 'down')}
                          className={`p-1 rounded-md hover:bg-slate-100 transition-colors cursor-pointer ${
                            feedbackMap[msg.id] === 'down' ? 'text-rose-500 font-bold' : ''
                          }`}
                          title="Needs improvement"
                        >
                          <ThumbsDown className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {isUser && (
                  <div className="mt-1 text-[9px] text-slate-300 text-right">
                    {msg.timestamp}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isSending && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-teal-600 text-white shadow-xs flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none px-4 py-3 text-xs text-slate-500 flex items-center gap-2 shadow-xs">
              <div className="w-2 h-2 rounded-full bg-teal-600 animate-bounce" />
              <div className="w-2 h-2 rounded-full bg-teal-600 animate-bounce [animation-delay:0.2s]" />
              <div className="w-2 h-2 rounded-full bg-teal-600 animate-bounce [animation-delay:0.4s]" />
              <span className="ml-1 text-[11px] font-medium text-slate-600">
                CymbalMart Assistant is reviewing inventory & planning math...
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Inquiries / Quick Prompts */}
      <div className="bg-white border-x border-t border-slate-200 p-2.5 flex items-center gap-2 overflow-x-auto">
        <span className="text-[10px] uppercase font-bold text-slate-400 shrink-0 flex items-center gap-1">
          <Lightbulb className="w-3 h-3 text-amber-500" />
          <span>Quick Ask:</span>
        </span>
        {CATEGORIZED_PROMPTS.flatMap((c) => c.prompts).map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(prompt)}
            className="text-[11px] px-2.5 py-1 rounded-full bg-slate-50 hover:bg-teal-50 text-slate-600 hover:text-teal-800 border border-slate-200 hover:border-teal-300 whitespace-nowrap shrink-0 transition-colors cursor-pointer font-medium"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Bar */}
      <div className="bg-white border border-slate-200 rounded-b-2xl p-3 flex items-center gap-2 shadow-xs">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask CymbalMart Assistant anything about party planning, item aisles, portion sizes, or budget swaps..."
          className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-colors"
        />
        <button
          onClick={() => handleSend()}
          disabled={!input.trim() || isSending}
          className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap shrink-0"
        >
          <span>Ask Assistant</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
