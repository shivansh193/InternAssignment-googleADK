"use client"
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Bot, User, Calculator, Atom, Plus, Trash2, MessageSquare, Sparkles, Brain, Zap } from 'lucide-react';

// Types
interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  agent?: 'tutor' | 'math' | 'physics';
  isLoading?: boolean;
}

interface ChatSession {
  id: string;
  title: string;
  timestamp: string;
  messages: Message[];
  preview?: string;
}

interface Agent {
  id: 'tutor' | 'math' | 'physics';
  name: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color: string;
  description: string;
}

// Agent configurations
const agents: Agent[] = [
  {
    id: 'tutor',
    name: 'AI Tutor',
    icon: Bot,
    color: 'from-purple-500 to-pink-500',
    description: 'Main tutoring assistant'
  },
  {
    id: 'math',
    name: 'Math Agent',
    icon: Calculator,
    color: 'from-blue-500 to-cyan-500',
    description: 'Mathematics specialist'
  },
  {
    id: 'physics',
    name: 'Physics Agent',
    icon: Atom,
    color: 'from-green-500 to-emerald-500',
    description: 'Physics specialist'
  }
];

// Custom hook for chat management
const useChat = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize with a default session
  useEffect(() => {
    const defaultSession: ChatSession = {
      id: Date.now().toString(),
      title: 'Welcome Chat',
      timestamp: new Date().toISOString(),
      messages: [{
        id: '1',
        content: 'Hello! I\'m your AI Tutor. I can help you with mathematics, physics, and other subjects. What would you like to learn today?',
        sender: 'assistant',
        timestamp: new Date(),
        agent: 'tutor'
      }],
      preview: 'Hello! I\'m your AI Tutor...'
    };
    setSessions([defaultSession]);
    setCurrentSession(defaultSession);
    setMessages(defaultSession.messages);
  }, []);

  const createNewSession = useCallback(() => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: 'New Chat',
      timestamp: new Date().toISOString(),
      messages: [],
      preview: ''
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSession(newSession);
    setMessages([]);
  }, []);

  const switchSession = useCallback((session: ChatSession) => {
    setCurrentSession(session);
    setMessages(session.messages);
  }, []);

  const deleteSession = useCallback((sessionId: string) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    if (currentSession?.id === sessionId) {
      createNewSession();
    }
  }, [currentSession, createNewSession]);

  const sendMessage = useCallback(async (content: string) => {
    if (!currentSession) return;

    console.log('Sending message to backend:', content);

    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      sender: 'user',
      timestamp: new Date()
    };

    const loadingMessage: Message = {
      id: (Date.now() + 1).toString(),
      content: '',
      sender: 'assistant',
      timestamp: new Date(),
      agent: 'tutor',
      isLoading: true
    };

    setMessages(prev => [...prev, userMessage, loadingMessage]);
    setIsLoading(true);

    try {
      // Prepare context from previous messages
      const contextMessages = messages.map(msg => ({
        id: msg.id,
        content: msg.content,
        sender: msg.sender,
        timestamp: msg.timestamp,
        agent: msg.agent
      }));

      console.log('Preparing API request with context:', contextMessages.length > 0 ? 'Context included' : 'No context');
      
      // Make actual API call to the backend
      const response = await fetch('/api/chat/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content,
          sessionId: currentSession.id,
          context: contextMessages
        })
      });

      console.log('API response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API error:', errorData);
        throw new Error(errorData.message || 'Failed to get response from AI');
      }

      const data = await response.json();
      console.log('API response data:', data);

      const assistantMessage: Message = {
        id: (Date.now() + 2).toString(),
        content: data.message,
        sender: 'assistant',
        timestamp: new Date(data.timestamp),
        agent: data.agent
      };

      setMessages(prev => prev.slice(0, -1).concat(assistantMessage));

      // Update session
      const updatedMessages = [...messages, userMessage, assistantMessage];
      const updatedSession: ChatSession = {
        ...currentSession,
        messages: updatedMessages,
        preview: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
        title: updatedMessages.length === 2 ? content.substring(0, 30) + (content.length > 30 ? '...' : '') : currentSession.title
      };

      setSessions(prev => prev.map(s => s.id === currentSession.id ? updatedSession : s));
      setCurrentSession(updatedSession);
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove loading message and show error
      setMessages(prev => prev.filter(msg => !msg.isLoading));
      // Optionally add an error message to the chat
    } finally {
      setIsLoading(false);
    }
  }, [currentSession, messages]);

  return {
    sessions,
    currentSession,
    messages,
    isLoading,
    createNewSession,
    switchSession,
    deleteSession,
    sendMessage
  };
};

// Helper functions for the chat interface

// Message Bubble Component
const MessageBubble: React.FC<{ message: Message }> = ({ message }) => {
  const agent = agents.find(a => a.id === message.agent);
  const IconComponent = agent?.icon || User;

  return (
    <div className={`flex gap-3 mb-6 ${message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'} animate-fadeInUp`}>
      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
        message.sender === 'user' 
          ? 'bg-gradient-to-br from-indigo-500 to-purple-600' 
          : `bg-gradient-to-br ${agent?.color || 'from-gray-500 to-gray-600'}`
      } shadow-lg`}>
        {message.sender === 'user' ? (
          <User className="w-5 h-5 text-white" />
        ) : (
          <IconComponent className="w-5 h-5 text-white" />
        )}
      </div>
      
      <div className={`max-w-[70%] ${message.sender === 'user' ? 'text-right' : 'text-left'}`}>
        {message.sender === 'assistant' && agent && (
          <div className="flex items-center gap-2 mb-1">
            <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              agent.id === 'math' ? 'bg-blue-500/20 text-blue-300' :
              agent.id === 'physics' ? 'bg-green-500/20 text-green-300' :
              'bg-purple-500/20 text-purple-300'
            }`}>
              <div className="flex items-center gap-1">
                <IconComponent className="w-3 h-3" />
                <span>{agent.name}</span>
              </div>
            </div>
            {(agent.id === 'math' || agent.id === 'physics') && (
              <div className="px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300 text-xs font-medium flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>Specialized Agent</span>
              </div>
            )}
          </div>
        )}
        
        <div className={`p-4 rounded-2xl shadow-lg backdrop-blur-sm ${
          message.sender === 'user'
            ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'
            : message.agent === 'math' ? 'bg-blue-900/30 border border-blue-700/30 text-gray-100' :
              message.agent === 'physics' ? 'bg-green-900/30 border border-green-700/30 text-gray-100' :
              'bg-white/10 border border-white/20 text-gray-100'
        } ${message.isLoading ? 'animate-pulse' : ''}`}>
          {message.isLoading ? (
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
              <span className="text-sm text-gray-400">AI is thinking...</span>
            </div>
          ) : (
            <div>
              {(message.agent === 'math' || message.agent === 'physics') && message.sender === 'assistant' && (
                <div className="mb-2 text-xs text-gray-400 italic">
                  Using specialized {message.agent === 'math' ? 'mathematics' : 'physics'} knowledge to answer this question...
                </div>
              )}
              <div className="text-sm leading-relaxed">
                {message.content.split('\n').map((paragraph, index) => {
                  // Process equations in the paragraph
                  let processedParagraph = paragraph;
                  
                  // Extract agent prefix if present (e.g., "Math Agent:" or "Physics Agent:")
                  const agentPrefixRegex = /(Math Agent:|Physics Agent:|AI Tutor:|Tutor Agent:)\s*(.*)/i;
                  const agentPrefixMatch = paragraph.match(agentPrefixRegex);
                  
                  let agentPrefix = '';
                  let contentWithoutPrefix = processedParagraph;
                  
                  if (agentPrefixMatch) {
                    agentPrefix = agentPrefixMatch[1];
                    contentWithoutPrefix = agentPrefixMatch[2];
                    // Update the processed paragraph without the prefix for further processing
                    processedParagraph = contentWithoutPrefix;
                  }
                  
                  // Check for Tools Used section
                  const toolsUsedRegex = /Tools Used:\s*(.+)/i;
                  const toolsUsedMatch = processedParagraph.match(toolsUsedRegex);
                  
                  if (toolsUsedMatch) {
                    processedParagraph = `<div class="mt-3 pt-2 border-t border-gray-700/30">
                      <span class="text-xs font-semibold text-gray-400">Tools Used/Remarks for Improvements:</span> 
                      <span class="text-xs bg-gray-800/50 px-2 py-1 rounded-md ml-2">${toolsUsedMatch[1]}</span>
                    </div>`;
                  }
                  // Process equations in the paragraph
                  else if (processedParagraph.includes('=') || 
                      /[a-z]\^[0-9]/.test(processedParagraph) || 
                      processedParagraph.includes('sqrt')) {
                    // Highlight displayed equations (on their own line with mathematical notation)
                    if (/^\s*[a-zA-Z0-9\s\+\-\*\/\(\)=\^\\]+\s*$/.test(processedParagraph)) {
                      processedParagraph = `<div class="my-2 py-1 px-2 bg-gray-800/30 rounded-md text-center">${processedParagraph}</div>`;
                    }
                  }
                  
                  // Check if it's a specialist agent response
                  if (agentPrefix) {
                    let agentClass = '';
                    if (agentPrefix.includes('Math')) {
                      agentClass = 'border-blue-500/50';
                    } else if (agentPrefix.includes('Physics')) {
                      agentClass = 'border-green-500/50';
                    } else {
                      agentClass = 'border-purple-500/50';
                    }
                    
                    return (
                      <div key={index} className={`my-2 p-2 border-l-4 ${agentClass} pl-2`}>
                        <div className="font-medium text-xs mb-1">{agentPrefix}</div>
                        <div dangerouslySetInnerHTML={{ __html: processedParagraph }} />
                      </div>
                    );
                  }
                  
                  // Regular paragraph
                  return paragraph ? (
                    <p key={index} className="mb-2" dangerouslySetInnerHTML={{ __html: processedParagraph }} />
                  ) : <br key={index} />;
                })}
              </div>
            </div>
          )}
        </div>
        
        <div className="text-xs text-gray-500 mt-1">
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
};

// Chat Sidebar Component
const ChatSidebar: React.FC<{
  sessions: ChatSession[];
  currentSession: ChatSession | null;
  onSelectSession: (session: ChatSession) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
}> = ({ sessions, currentSession, onSelectSession, onNewChat, onDeleteSession }) => {
  return (
    <div className="w-80 bg-black/20 backdrop-blur-xl border-r border-white/10 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">AI Tutor</h1>
            <p className="text-sm text-gray-400">Multi-Agent Learning Assistant</p>
          </div>
        </div>
        
        <button
          onClick={onNewChat}
          className="w-full flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          <Plus className="w-5 h-5" />
          <span className="font-medium">New Chat</span>
        </button>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          {sessions.map((session) => (
            <div
              key={session.id}
              className={`group relative p-4 rounded-xl cursor-pointer transition-all duration-200 ${
                currentSession?.id === session.id
                  ? 'bg-white/10 border border-white/20'
                  : 'hover:bg-white/5'
              }`}
              onClick={() => onSelectSession(session)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-white truncate">
                    {session.title}
                  </h3>
                  {session.preview && (
                    <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                      {session.preview}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(session.timestamp).toLocaleDateString()}
                  </p>
                </div>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSession(session.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-all duration-200"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Agent Status */}
      <div className="p-4 border-t border-white/10">
        <div className="text-xs text-gray-400 mb-3">Available Agents</div>
        <div className="space-y-2">
          {agents.map((agent) => {
            const IconComponent = agent.icon;
            return (
              <div key={agent.id} className="flex items-center gap-3 p-2 rounded-lg bg-white/5">
                <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${agent.color} flex items-center justify-center`}>
                  <IconComponent className="w-3 h-3 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-white">{agent.name}</div>
                  <div className="text-xs text-gray-400 truncate">{agent.description}</div>
                </div>
                <div className="w-2 h-2 rounded-full bg-green-400"></div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Input Area Component
const InputArea: React.FC<{
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}> = ({ onSendMessage, isLoading }) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  };

  return (
    <div className="p-6 border-t border-white/10 bg-black/20 backdrop-blur-xl">
      <div className="relative flex items-end gap-3">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInput}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about math, physics, or any subject..."
            className="w-full p-4 pr-12 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm transition-all duration-200"
            rows={1}
            style={{ minHeight: '56px', maxHeight: '120px' }}
            disabled={isLoading}
          />
          {input && (
            <div className="absolute right-3 bottom-3">
              <div className="text-xs text-gray-400">
                {input.length}/1000
              </div>
            </div>
          )}
        </div>
        
        <button
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          className="w-14 h-14 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>
      
      <div className="flex items-center justify-center mt-4 gap-6 text-xs text-gray-400">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          <span>Powered by Multi-Agent AI</span>
        </div>
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4" />
          <span>Instant Expert Help</span>
        </div>
      </div>
    </div>
  );
};

// Main Chat Interface Component
const ChatInterface: React.FC = () => {
  const {
    sessions,
    currentSession,
    messages,
    isLoading,
    createNewSession,
    switchSession,
    deleteSession,
    sendMessage
  } = useChat();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -inset-10 opacity-30">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
          <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
        </div>
      </div>

      {/* Sidebar */}
      <ChatSidebar
        sessions={sessions}
        currentSession={currentSession}
        onSelectSession={switchSession}
        onNewChat={createNewSession}
        onDeleteSession={deleteSession}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative z-10">
        {/* Chat Header */}
        <div className="p-6 border-b border-white/10 bg-black/20 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">
                {currentSession?.title || 'AI Tutor Chat'}
              </h2>
              <p className="text-sm text-gray-400">
                Get help with math, physics, and more
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse"></div>
              <span className="text-sm text-gray-400">Online</span>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-6">
                <MessageSquare className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Welcome to AI Tutor!</h3>
              <p className="text-gray-400 mb-8 max-w-md">
                I&apos;m here to help you learn! Ask me questions about mathematics, physics, or any other subject you&apos;d like to explore.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl">
                {agents.map((agent) => {
                  const IconComponent = agent.icon;
                  return (
                    <div key={agent.id} className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${agent.color} flex items-center justify-center mb-3`}>
                        <IconComponent className="w-5 h-5 text-white" />
                      </div>
                      <h4 className="font-medium text-white mb-1">{agent.name}</h4>
                      <p className="text-sm text-gray-400">{agent.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <InputArea onSendMessage={sendMessage} isLoading={isLoading} />
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        
        .animate-fadeInUp {
          animation: fadeInUp 0.5s ease-out;
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default ChatInterface;