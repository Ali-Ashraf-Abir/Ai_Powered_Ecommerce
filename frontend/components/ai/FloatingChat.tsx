'use client';
import React, { useState, useEffect, useRef, KeyboardEvent, ChangeEvent } from 'react';
import { Send, MessageCircle, X, Minimize2, Maximize2, Loader, Sparkles, ShoppingBag } from 'lucide-react';

// Define the shape of a message
interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  read?: boolean;
  isError?: boolean;
  // Assistant specific properties
  searchParams?: Record<string, unknown>;
  resultCount?: number;
  action?: 'navigate_suggestions' | 'navigate_product' | 'stay';
  navigationPath?: string;
  productId?: string | number;
}

// Define the shape of the API response
interface ChatApiResponse {
  ok: boolean;
  message: string;
  error?: string;
  searchParams?: Record<string, unknown>;
  resultCount?: number;
  action?: 'navigate_suggestions' | 'navigate_product' | 'stay';
  navigationPath?: string;
  results?: unknown[];
  productId?: string | number;
}

export default function FloatingAssistant() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
  const [sessionId] = useState<string>(() => {
    // Check if session exists in localStorage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('chat_session_id');
      if (stored) return stored;
      const newId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('chat_session_id', newId);
      return newId;
    }
    return '';
  });

  const [unreadCount, setUnreadCount] = useState<number>(0);
  
  // Type the refs for specific HTML elements
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Load conversation history from localStorage
    const stored = localStorage.getItem(`chat_messages_${sessionId}`);
    if (stored) {
      try {
        const parsed: Message[] = JSON.parse(stored);
        setMessages(parsed);
      } catch (e) {
        console.error('Failed to load chat history:', e);
      }
    } else {
      // Welcome message
      const welcomeMsg: Message = {
        role: 'assistant',
        content: "👋 Hi! I'm your personal shopping assistant. I can help you find products, answer questions, and guide you through your shopping journey. Try asking me something like 'Show me black dresses' or 'I need a gift for my friend'",
        timestamp: Date.now()
      };
      setMessages([welcomeMsg]);
      localStorage.setItem(`chat_messages_${sessionId}`, JSON.stringify([welcomeMsg]));
    }
  }, [sessionId]);

  useEffect(() => {
    // Save messages to localStorage whenever they change
    if (messages.length > 0) {
      localStorage.setItem(`chat_messages_${sessionId}`, JSON.stringify(messages));
    }
  }, [messages, sessionId]);

  // --- FIXED USE EFFECT ---
  useEffect(() => {
    // Update unread count when chat is closed
    if (!isOpen) {
      const assistantMessages = messages.filter(m => m.role === 'assistant' && !m.read);
      setUnreadCount(assistantMessages.length);
    } else {
      // FIX: Check if there are unread messages BEFORE updating state
      // to avoid infinite loop (State Update -> Effect -> State Update -> ...)
      const hasUnreadMessages = messages.some(m => !m.read);
      
      if (hasUnreadMessages) {
        setMessages(prev => prev.map(m => ({ ...m, read: true })));
      }
      setUnreadCount(0);
    }
  }, [isOpen, messages]);
  // ------------------------

  const navigateToPage = (path: string) => {
    // Use window.location for navigation
    window.location.href = path;
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: inputMessage,
      timestamp: Date.now(),
      read: true
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: inputMessage,
          sessionId,
          currentPage: window.location.pathname
        })
      });

      const data: ChatApiResponse = await response.json();

      if (!data.ok) {
        throw new Error(data.error || 'Failed to process message');
      }

      // Add assistant response
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.message,
        timestamp: Date.now(),
        searchParams: data.searchParams,
        resultCount: data.resultCount,
        action: data.action, // Can be 'navigate_suggestions', 'navigate_product', 'stay'
        navigationPath: data.navigationPath,
        read: isOpen
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Handle navigation based on AI response
      if (data.action === 'navigate_suggestions' && data.results && data.results.length > 0) {
        // Store results in sessionStorage for the suggestions page
        sessionStorage.setItem('search_results', JSON.stringify(data.results));
        sessionStorage.setItem('search_params', JSON.stringify(data.searchParams));
        
        // Navigate to suggestions page after a brief delay
        setTimeout(() => {
          navigateToPage('/suggestions');
        }, 1000);
      } else if (data.action === 'navigate_product' && data.productId) {
        // Navigate to specific product page
        setTimeout(() => {
          navigateToPage(`/products/${data.productId}`);
        }, 1000);
      }

    } catch (error: any) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error.message || 'Unknown error'}. Please try again.`,
        timestamp: Date.now(),
        isError: true,
        read: isOpen
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    if (confirm('Are you sure you want to clear this conversation?')) {
      const welcomeMsg: Message = {
        role: 'assistant',
        content: "Conversation cleared. How can I help you today?",
        timestamp: Date.now(),
        read: true
      };
      setMessages([welcomeMsg]);
      localStorage.setItem(`chat_messages_${sessionId}`, JSON.stringify([welcomeMsg]));
      
      // Clear session on server
      fetch(`${API_BASE}/ai/chat/session/${sessionId}`, { method: 'DELETE' })
        .catch(err => console.error('Failed to clear server session:', err));
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    setIsMinimized(false);
  };

  // Floating chat button (bottom right)
  if (!isOpen) {
    return (
      <button
        onClick={toggleChat}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-transform duration-200 z-50 group"
        aria-label="Open chat"
      >
        <MessageCircle className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-pulse">
            {unreadCount}
          </span>
        )}
        <span className="absolute right-full mr-3 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          Chat with AI Assistant
        </span>
      </button>
    );
  }

  // Expanded chat window
  return (
    <div
      ref={chatContainerRef}
      className={`fixed z-50 transition-all duration-300 ${
        isMinimized 
          ? 'bottom-6 right-6 w-80'
          : 'bottom-6 right-6 w-96 h-[600px]'
      }`}
    >
      <div className="bg-white rounded-2xl shadow-2xl flex flex-col h-full overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg">AI Assistant</h3>
              <p className="text-xs text-purple-100">Always here to help</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="hover:bg-white/20 p-2 rounded-lg transition"
              aria-label={isMinimized ? "Maximize" : "Minimize"}
            >
              {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={toggleChat}
              className="hover:bg-white/20 p-2 rounded-lg transition"
              aria-label="Close chat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                        : msg.isError
                        ? 'bg-red-50 text-red-900 border border-red-200'
                        : 'bg-white text-gray-900 border border-gray-200 shadow-sm'
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    {msg.resultCount !== undefined && (
                      <div className="mt-2 pt-2 border-t border-purple-200 flex items-center gap-2">
                        <ShoppingBag className="w-3 h-3" />
                        <p className="text-xs opacity-90">
                          Found {msg.resultCount} products
                        </p>
                      </div>
                    )}
                    {msg.action === 'navigate_suggestions' && (
                      <div className="mt-2 text-xs opacity-90 flex items-center gap-1">
                        <span className="animate-pulse">→</span> Taking you to suggestions...
                      </div>
                    )}
                    {msg.action === 'navigate_product' && (
                      <div className="mt-2 text-xs opacity-90 flex items-center gap-1">
                        <span className="animate-pulse">→</span> Opening product details...
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
                    <Loader className="w-4 h-4 animate-spin text-purple-600" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions */}
            <div className="px-4 py-2 bg-white border-t border-gray-200">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setInputMessage("Show me new arrivals")}
                  className="text-xs bg-purple-50 text-purple-700 px-3 py-1.5 rounded-full hover:bg-purple-100 transition"
                >
                  New Arrivals
                </button>
                <button
                  onClick={() => setInputMessage("I need a gift")}
                  className="text-xs bg-pink-50 text-pink-700 px-3 py-1.5 rounded-full hover:bg-pink-100 transition"
                >
                  Gift Ideas
                </button>
                <button
                  onClick={clearChat}
                  className="text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full hover:bg-gray-200 transition"
                >
                  Clear Chat
                </button>
              </div>
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t border-gray-200">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything..."
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent text-sm"
                  disabled={isLoading}
                />
                <button
                  onClick={sendMessage}
                  disabled={isLoading || !inputMessage.trim()}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2.5 rounded-xl hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  aria-label="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}