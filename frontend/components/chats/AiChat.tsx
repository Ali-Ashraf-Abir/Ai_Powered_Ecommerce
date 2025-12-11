'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { MessageCircle, X, Send } from 'lucide-react';
import { api } from '@/lib/api';

import type { ChatMessage, Product } from '@/types';
import { useAuth } from '@/context/AuthContext';

interface AIChatProps {
  products?: Product[];
}

export default function AIChat({ products = [] }: AIChatProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        "Hi! I'm your AI shopping assistant. I can help you find the perfect products, answer questions, and guide you through your shopping journey. What are you looking for today?",
    },
  ]);
  const [input, setInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { user } = useAuth();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      // TODO: Replace with actual API call when RAG is ready
      // const data = await api.sendChatMessage({
      //   message: userMessage,
      //   conversationHistory: messages
      // });

      // Simulate AI response for now
      await new Promise((resolve) => setTimeout(resolve, 1000));

      let response = "I'd be happy to help you with that! ";
      const lowerInput = userMessage.toLowerCase();

      // Simple keyword matching for demo
      if (lowerInput.includes('dress') || lowerInput.includes('dresses')) {
        const dresses = products
          .filter((p) => p.category === 'dresses')
          .slice(0, 3);
        if (dresses.length > 0) {
          response += `I found some beautiful dresses for you:\n\n`;
          dresses.forEach((d) => {
            response += `• ${d.name} - $${d.price}\n`;
          });
          response += `\nWould you like me to show you any of these?`;
        }
      } else if (
        lowerInput.includes('jacket') ||
        lowerInput.includes('jackets')
      ) {
        response +=
          'Let me show you our jacket collection. We have both casual and formal options.';
        setTimeout(() => router.push('/products?category=jackets'), 2000);
      } else if (
        lowerInput.includes('price') ||
        lowerInput.includes('budget')
      ) {
        response +=
          'I can help you find items within your budget. What price range are you looking for?';
      } else if (
        lowerInput.includes('cart') ||
        lowerInput.includes('checkout')
      ) {
        response +=
          'Let me take you to your cart so you can review your items.';
        setTimeout(() => router.push('/cart'), 2000);
      } else if (
        lowerInput.includes('order') ||
        lowerInput.includes('orders')
      ) {
        response += 'Let me show you your orders.';
        setTimeout(() => router.push('/orders'), 2000);
      } else {
        response +=
          "Could you tell me more about what you're looking for? Are you interested in any specific category like dresses, jackets, or accessories?";
      }

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: response },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            "I apologize, but I'm having trouble right now. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-indigo-600 text-white p-4 rounded-full shadow-lg hover:bg-indigo-700 z-50"
        aria-label="Open chat"
      >
        <MessageCircle className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col z-50">
      {/* Header */}
      <div className="bg-indigo-600 text-white p-4 rounded-t-2xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          <h3 className="font-semibold">AI Shopping Assistant</h3>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="hover:bg-indigo-700 rounded p-1"
          aria-label="Close chat"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                message.role === 'user'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 p-3 rounded-lg">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            aria-label="Send message"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}