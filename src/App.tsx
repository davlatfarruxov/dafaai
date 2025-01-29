import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, AlertCircle } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Get API key from environment variables
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Initialize Gemini Pro with error handling
let genAI: GoogleGenerativeAI | null = null;
try {
  if (!API_KEY) {
    throw new Error('Gemini API key not found in environment variables');
  }
  genAI = new GoogleGenerativeAI(API_KEY);
} catch (error) {
  console.error('Failed to initialize Gemini AI:', error instanceof Error ? error.message : 'Unknown error');
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  error?: boolean;
}

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Clear any previous errors
    setError(null);

    // Check if API is properly initialized
    if (!genAI) {
      const errorMessage = 'AI service is not properly configured. Please check your API key.';
      setError(errorMessage);
      console.error(errorMessage);
      return;
    }

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
      const result = await model.generateContent(userMessage);
      const response = await result.response;
      const text = response.text();

      if (!text) {
        throw new Error('Received empty response from AI');
      }

      setMessages(prev => [...prev, { role: 'assistant', content: text }]);
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'An unexpected error occurred while processing your request';
      
      console.error('Chat error:', errorMessage);
      
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error while processing your request. Please try again.',
        error: true
      }]);
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 shadow-lg border-b border-gray-700 p-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <Bot className="w-8 h-8 text-yellow-400 mr-3" />
            <h1 className="text-xl font-semibold text-white">DAFA AI</h1>
          </div>
          {error && (
            <div className="flex items-center text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 mr-2" />
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-900">
        <div className="container mx-auto max-w-4xl">
          {messages.length === 0 && (
            <div className="text-center text-gray-400 mt-8">
              <Bot className="w-12 h-12 mx-auto mb-4 text-yellow-400" />
              <p className="text-lg mb-2">Assalomu Alaykum sizga qanday yordam berishim mumkin?</p>
              <p className="text-sm">Xohlagan savolingizni so'rang. Yordam berishga tayyorman!</p>
            </div>
          )}
          
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex items-start mb-4 ${
                message.role === 'assistant' ? 'justify-start' : 'justify-end'
              }`}
            >
              {message.role === 'assistant' && (
                <div className="flex-shrink-0 mr-3">
                  <Bot className="w-6 h-6 text-yellow-400" />
                </div>
              )}
              <div
                className={`rounded-lg px-4 py-2 max-w-[80%] ${
                  message.role === 'assistant'
                    ? message.error 
                      ? 'bg-red-900 text-red-200 border border-red-700'
                      : 'bg-gray-800 text-white border border-gray-700'
                    : 'bg-yellow-500 text-gray-900 font-medium'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
              {message.role === 'user' && (
                <div className="flex-shrink-0 ml-3">
                  <User className="w-6 h-6 text-yellow-400" />
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex items-center text-gray-400 mb-4">
              <Bot className="w-6 h-6 text-yellow-400 mr-3" />
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Form */}
      <div className="bg-gray-800 border-t border-gray-700">
        <div className="container mx-auto max-w-4xl p-4">
          <form onSubmit={handleSubmit} className="flex gap-4">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Yozing..."
              className="flex-1 rounded-lg border border-gray-600 bg-gray-700 text-white px-4 py-2 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 placeholder-gray-400"
              disabled={isLoading || !genAI}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim() || !genAI}
              className="bg-yellow-500 text-gray-900 px-4 py-2 rounded-lg hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
            >
              <Send className="w-4 h-4" />
              Yuborish
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default App;