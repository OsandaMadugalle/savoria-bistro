import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, ChefHat, Loader2 } from 'lucide-react';
import { sendMessageToChef } from '../services/geminiService';
import { fetchMenu } from '../services/api';
import { MenuItem, CartItem, User } from '../types';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

interface AIChefProps {
  user: User | null;
  cart: CartItem[];
  setCart?: (cart: CartItem[]) => void;
}

const AIChef: React.FC<AIChefProps> = ({ cart, setCart }) => {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: 'init', role: 'assistant', text: "Bonjour! I am Chef Gustav. How can I assist you with our menu today?" }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Listen for add-to-cart events from chat
  useEffect(() => {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent;
      const item = customEvent.detail as MenuItem;
      if (!item) return;
      const existing = cart.find(ci => ci.id === item.id);
      let newCart: CartItem[];
      if (existing) {
        newCart = cart.map(ci =>
          ci.id === item.id ? { ...ci, quantity: ci.quantity + 1 } : ci
        );
      } else {
        newCart = [...cart, { ...item, quantity: 1 }];
      }
      if (setCart) setCart(newCart);
    };
    window.addEventListener('add-to-cart', handler as EventListener);
    return () => window.removeEventListener('add-to-cart', handler as EventListener);
  }, [cart, setCart]);

  // Fetch menu on mount
  useEffect(() => {
    const loadMenu = async () => {
      try {
        const items = await fetchMenu();
        setMenu(items);
      } catch (e) {
        setMenu([]);
      }
    };
    loadMenu();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: inputText };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const context = { menu };
      const stream = sendMessageToChef(userMsg.text, context);
      let fullResponse = "";
      const responseId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, { id: responseId, role: 'assistant', text: '' }]);

      for await (const chunk of stream) {
        if (chunk) {
          fullResponse += chunk;
          setMessages(prev =>
            prev.map(msg => msg.id === responseId ? { ...msg, text: fullResponse } : msg)
          );
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to detect if a message is a menu sample
  const isMenuSample = (msg: Message) =>
    msg.role === 'assistant' &&
    msg.text.includes('[Menu](#/menu)') &&
    msg.text.match(/Menu[\s\S]*\[Menu\]\(#\/menu\)/i);

    // Helper to render menu sample without add-to-cart, and with a working View Full Menu button
    const renderMenuSample = (msg: Message) => {
      const [before, after] = msg.text.split('[Menu](#/menu)');
      const menuLines = before.split('\n');

      // Group menu item lines
      const groupedMenuItems: { nameLine: string; descLine?: string; itemName: string }[] = [];
      let i = 0;
      while (i < menuLines.length) {
        const line = menuLines[i];
        const nameMatch = line.match(/^\s*([\w\s'-]+?)(?:\s*\[.*?\])?\s*\$[\d.]+/);
        if (nameMatch) {
          const itemName = nameMatch[1].trim();
          const nextLine = menuLines[i + 1] || '';
          if (/^\s{2,}\S/.test(nextLine)) {
            groupedMenuItems.push({ nameLine: line, descLine: nextLine, itemName });
            i += 2;
            continue;
          } else {
            groupedMenuItems.push({ nameLine: line, itemName });
            i++;
            continue;
          }
        }
        i++;
      }

      return (
        <div key={msg.id} className="flex justify-start">
          <div className="max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed bg-white border border-stone-200 text-stone-800 rounded-tl-sm shadow-sm">
            {menuLines.map((line, idx) => {
              const group = groupedMenuItems.find(g => g.nameLine === line);
              if (group) {
                return (
                  <div key={idx} className="mb-1">
                    <span>{group.nameLine}</span>
                  </div>
                );
              }
              const isDesc = groupedMenuItems.some(g => g.descLine === line);
              if (isDesc) {
                return <div key={idx} className="ml-6 text-stone-600">{line}<br /></div>;
              }
              return <div key={idx}>{line}<br /></div>;
            })}
            <button
              onClick={() => window.location.assign('/menu')}
              className="inline-block mt-2 px-4 py-2 bg-orange-600 text-white rounded-full font-semibold shadow hover:bg-orange-700 transition-colors"
              aria-label="View the full menu page"
            >
              View Full Menu
            </button>
            {after && (
              <span>
                {after.split('\n').map((line, i) => (
                  <React.Fragment key={i}>
                    {line}
                    <br />
                  </React.Fragment>
                ))}
              </span>
            )}
          </div>
        </div>
      );
    };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Overlay for closing on outside click */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/10 cursor-pointer"
            onClick={() => setIsOpen(false)}
            aria-label="Close AI Chef chat"
          />
          <div className="mb-4 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col h-[500px] animate-in fade-in slide-in-from-bottom-10 duration-300 z-50">
            {/* Header */}
            <div className="bg-orange-700 p-4 flex justify-between items-center text-white">
              <div className="flex items-center gap-2">
                <div className="bg-white/20 p-1.5 rounded-full">
                  <ChefHat size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Chef Gustav</h3>
                  <p className="text-xs text-orange-100">AI Concierge</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 bg-stone-50 space-y-4">
              {messages.map((msg) => (
                isMenuSample(msg)
                  ? renderMenuSample(msg)
                  : (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${
                          msg.role === 'user'
                            ? 'bg-orange-600 text-white rounded-tr-sm'
                            : 'bg-white border border-stone-200 text-stone-800 rounded-tl-sm shadow-sm'
                        }`}
                      >
                        {msg.text.split('\n').map((line, i) => (
                          <React.Fragment key={i}>
                            {line}
                            <br />
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  )
              ))}
              {isLoading && messages[messages.length - 1]?.role === 'user' && (
                <div className="flex justify-start">
                  <div className="bg-white border border-stone-200 p-3 rounded-2xl rounded-tl-sm shadow-sm">
                    <Loader2 className="animate-spin text-orange-600" size={16} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 bg-white border-t border-stone-200">
              <div className="flex items-center gap-2 bg-stone-100 rounded-full px-4 py-2 border border-stone-200 focus-within:border-orange-500 focus-within:ring-1 focus-within:ring-orange-500 transition-all">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask about dishes..."
                  className="flex-1 bg-transparent border-none outline-none text-sm text-stone-800 placeholder-stone-400"
                  disabled={isLoading}
                />
                <button
                  onClick={handleSend}
                  disabled={!inputText.trim() || isLoading}
                  className="text-orange-600 hover:text-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group flex items-center gap-2 bg-orange-700 hover:bg-orange-800 text-white p-4 rounded-full shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
        >
          <MessageCircle size={24} />
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 ease-in-out whitespace-nowrap font-medium pr-0 group-hover:pr-2">
            Ask Chef
          </span>
        </button>
      )}
    </div>
  );
};

export default AIChef;