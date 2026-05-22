import { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Send, MessageSquare, Trash2, BarChart3, Shield, Search, MoreHorizontal, FolderOpen, Code } from 'lucide-react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const id = localStorage.getItem('sessionId') || uuidv4();
    localStorage.setItem('sessionId', id);
    setSessionId(id);
    loadConversations();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversations = async () => {
    try {
      const res = await fetch('/api/conversations');
      const data = await res.json();
      setConversations(data);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  };

  const loadConversation = async (id) => {
    try {
      const res = await fetch(`/api/conversations/${id}`);
      const data = await res.json();
      setMessages(data.messages || []);
      setCurrentConversationId(id);
      setSessionId(data.sessionId);
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
  };

  const deleteConversation = async (id, title) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${title || 'this conversation'}"?`
    );
    
    if (!confirmDelete) {
      return;
    }

    try {
      await fetch(`/api/conversations/${id}`, { method: 'DELETE' });
      loadConversations();
      if (currentConversationId === id) {
        setMessages([]);
        setCurrentConversationId(null);
        const newSessionId = uuidv4();
        setSessionId(newSessionId);
        localStorage.setItem('sessionId', newSessionId);
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      alert('Failed to delete conversation. Please try again.');
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input, sessionId }),
      });

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = { role: 'assistant', content: '' };
      setMessages(prev => [...prev, assistantMessage]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));
            
            if (data.chunk) {
              assistantMessage.content += data.chunk;
              setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = { ...assistantMessage };
                return newMessages;
              });
            }

            if (data.done) {
              setCurrentConversationId(data.conversationId);
              loadConversations();
            }
          }
        }
      }
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = error.message?.includes('503') 
        ? 'The AI service is temporarily unavailable. Please try again in a moment.'
        : error.message?.includes('429')
        ? 'Rate limit exceeded. Please wait a moment and try again.'
        : 'Sorry, an error occurred. Please try again.';
      
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: errorMessage
      }]);
    } finally {
      setLoading(false);
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setCurrentConversationId(null);
    const newSessionId = uuidv4();
    setSessionId(newSessionId);
    localStorage.setItem('sessionId', newSessionId);
  };

  return (
    <div className="flex h-screen bg-[#0A0A0A] text-white">
      {/* Sidebar */}
      <div className="w-64 bg-[#171717] border-r border-[#2A2A2A] flex flex-col">
        {/* Sidebar Header */}
        <div className="p-3 space-y-2">
          <button
            onClick={startNewChat}
            className="w-full bg-white hover:bg-gray-100 text-black font-medium px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            <MessageSquare size={18} />
            New Chat
          </button>
          
          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search chats"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0A0A0A] text-white placeholder-gray-500 pl-9 pr-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-600"
            />
          </div>
        </div>

        {/* Recents Section */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-3 py-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Recents</h3>
          </div>
          
          <div className="px-2 space-y-1">
            {conversations
              .filter(conv => 
                !searchQuery || 
                conv.title?.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map(conv => (
                <div
                  key={conv.id}
                  className={`group relative p-3 rounded-lg cursor-pointer transition-all ${
                    currentConversationId === conv.id 
                      ? 'bg-[#2A2A2A]' 
                      : 'hover:bg-[#212121]'
                  }`}
                >
                  <div
                    onClick={() => loadConversation(conv.id)}
                    className="flex-1 pr-8"
                  >
                    <div className="text-sm font-medium truncate text-gray-100">
                      {conv.title || 'New Conversation'}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {new Date(conv.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteConversation(conv.id, conv.title);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-[#2A2A2A] space-y-2">
          <Link
            href="/dashboard"
            className="w-full bg-[#2A2A2A] hover:bg-[#333333] text-gray-200 px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            <BarChart3 size={18} />
            Analytics
          </Link>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-500 max-w-2xl px-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mx-auto mb-6 flex items-center justify-center">
                  <MessageSquare size={32} className="text-white" />
                </div>
                <h2 className="text-3xl font-semibold mb-3 text-gray-200">How can I help you today?</h2>
                <p className="text-gray-500">Start a conversation by typing a message below</p>
              </div>
            </div>
          )}

          <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 mt-1">
                    <MessageSquare size={16} className="text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] px-5 py-3 rounded-2xl ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-md'
                      : 'bg-[#2A2A2A] text-gray-100 rounded-bl-md'
                  }`}
                >
                  {msg.role === 'assistant' ? (
                    <div className="prose prose-invert prose-sm max-w-none">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          code({node, inline, className, children, ...props}) {
                            return inline ? (
                              <code className="bg-[#1A1A1A] px-1.5 py-0.5 rounded text-blue-400" {...props}>
                                {children}
                              </code>
                            ) : (
                              <code className="block bg-[#1A1A1A] p-3 rounded-lg overflow-x-auto text-sm" {...props}>
                                {children}
                              </code>
                            );
                          },
                          p: ({children}) => <p className="mb-2 last:mb-0">{children}</p>,
                          ul: ({children}) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                          ol: ({children}) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                          li: ({children}) => <li className="ml-2">{children}</li>,
                          h1: ({children}) => <h1 className="text-xl font-bold mb-2">{children}</h1>,
                          h2: ({children}) => <h2 className="text-lg font-bold mb-2">{children}</h2>,
                          h3: ({children}) => <h3 className="text-base font-bold mb-2">{children}</h3>,
                          strong: ({children}) => <strong className="font-bold text-white">{children}</strong>,
                          em: ({children}) => <em className="italic">{children}</em>,
                          blockquote: ({children}) => (
                            <blockquote className="border-l-4 border-blue-500 pl-4 italic my-2">
                              {children}
                            </blockquote>
                          ),
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                  )}
                </div>
                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-sm font-semibold">You</span>
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <MessageSquare size={16} className="text-white" />
                </div>
                <div className="bg-[#2A2A2A] px-5 py-4 rounded-2xl rounded-bl-md">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t border-[#2A2A2A] bg-[#0A0A0A]">
          <form onSubmit={sendMessage} className="max-w-3xl mx-auto p-4">
            <div className="relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Message..."
                className="w-full bg-[#2A2A2A] text-white placeholder-gray-500 px-5 py-4 pr-12 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white p-2.5 rounded-lg transition-colors"
              >
                <Send size={18} />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
