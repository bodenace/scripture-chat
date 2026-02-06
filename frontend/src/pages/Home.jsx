/**
 * Home Page
 * Main chat interface - accessible to everyone
 * Prompts account creation after 25 free messages
 */

import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import ChatInput from '../components/ChatInput';
import ChatBubble from '../components/ChatBubble';
import SignupPrompt from '../components/SignupPrompt';

// Number of free messages before requiring signup
const FREE_MESSAGE_LIMIT = 25;
const STORAGE_KEY = 'scripturechat_anonymous_usage';

function Home() {
  const { user, isAuthenticated, refreshUser } = useAuth();
  
  // State
  const [messages, setMessages] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null); // Track current chat for authenticated users
  const [chatHistory, setChatHistory] = useState([]); // List of past conversations
  const [sidebarOpen, setSidebarOpen] = useState(true); // Sidebar visibility (desktop)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false); // Mobile sidebar
  const [historyLoading, setHistoryLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [error, setError] = useState(null);
  const [messageCount, setMessageCount] = useState(0);
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);
  const [verse, setVerse] = useState(null);
  
  const messagesEndRef = useRef(null);

  // Load anonymous usage from localStorage OR reset for authenticated users
  useEffect(() => {
    if (!isAuthenticated) {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const data = JSON.parse(stored);
          setMessageCount(data.count || 0);
          setMessages(data.messages || []);
        } catch (e) {
          console.error('Failed to parse stored data:', e);
        }
      }
    } else {
      // Reset chat state when user logs in (start fresh)
      setCurrentChatId(null);
      setMessages([]);
      // Fetch chat history for authenticated users
      fetchChatHistory();
    }
  }, [isAuthenticated]);

  /**
   * Fetch chat history for authenticated users
   */
  const fetchChatHistory = async () => {
    if (!isAuthenticated) return;
    
    setHistoryLoading(true);
    try {
      const response = await api.getChatHistory();
      setChatHistory(response.data.chats || []);
    } catch (err) {
      console.error('Failed to fetch chat history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  /**
   * Load a previous conversation
   */
  const loadChat = async (chatId) => {
    try {
      const response = await api.getChat(chatId);
      if (response.data.chat) {
        setCurrentChatId(response.data.chat.id);
        setMessages(response.data.chat.messages);
      }
    } catch (err) {
      console.error('Failed to load chat:', err);
      setError('Failed to load conversation. Please try again.');
    }
  };

  // Fetch verse of the day
  useEffect(() => {
    const fetchVerse = async () => {
      try {
        const response = await api.getVerseOfDay();
        setVerse(response.data.verse);
      } catch (err) {
        console.error('Failed to fetch verse:', err);
      }
    };
    fetchVerse();
  }, []);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Save anonymous usage to localStorage
  const saveAnonymousUsage = (count, msgs) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      count,
      messages: msgs.slice(-20), // Keep last 20 messages
      lastUsed: new Date().toISOString()
    }));
  };

  /**
   * Send a message
   */
  const handleSendMessage = async (message) => {
    if (!message.trim() || sending) return;

    // Check if anonymous user has reached limit
    if (!isAuthenticated && messageCount >= FREE_MESSAGE_LIMIT) {
      setShowSignupPrompt(true);
      return;
    }

    setError(null);
    setSending(true);

    // Add user message immediately
    const userMessage = {
      id: 'user-' + Date.now(),
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };
    
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);

    try {
      let response;
      
      if (isAuthenticated) {
        // Authenticated user - use API
        if (currentChatId) {
          // Continue existing conversation
          response = await api.sendMessage(currentChatId, message);
          
          // Add the AI response to existing messages
          if (response.data.message) {
            setMessages(prev => [...prev, response.data.message]);
          }
        } else {
          // Start new conversation
          response = await api.quickMessage(message);
          
          // Save the chat ID for future messages
          if (response.data.chat) {
            setCurrentChatId(response.data.chat.id);
            setMessages(response.data.chat.messages);
            // Refresh chat history to show the new conversation
            fetchChatHistory();
          }
        }
        // Refresh user data to update question count
        refreshUser();
      } else {
        // Anonymous user - use streaming API
        setStreaming(true);
        setStreamingContent('');
        
        // Add placeholder AI message that will be updated
        const aiMessageId = 'ai-' + Date.now();
        const placeholderMessage = {
          id: aiMessageId,
          role: 'assistant',
          content: '',
          timestamp: new Date().toISOString(),
          isStreaming: true
        };
        setMessages([...newMessages, placeholderMessage]);

        try {
          const result = await api.anonymousMessageStream(
            message, 
            messages,
            (chunk, fullContent) => {
              // Update the streaming content as chunks arrive
              setStreamingContent(fullContent);
              // Update the message in place
              setMessages(prev => prev.map(msg => 
                msg.id === aiMessageId 
                  ? { ...msg, content: fullContent }
                  : msg
              ));
            }
          );

          // Finalize the message
          const finalMessage = {
            id: aiMessageId,
            role: 'assistant',
            content: result.fullResponse,
            timestamp: result.timestamp,
            isStreaming: false
          };
          
          const updatedMessages = [...newMessages, finalMessage];
          setMessages(updatedMessages);
          
          // Update count and save to localStorage
          const newCount = messageCount + 1;
          setMessageCount(newCount);
          saveAnonymousUsage(newCount, updatedMessages);
          
          // Show signup prompt if limit reached
          if (newCount >= FREE_MESSAGE_LIMIT) {
            setTimeout(() => setShowSignupPrompt(true), 1000);
          }
        } finally {
          setStreaming(false);
          setStreamingContent('');
        }
      }

    } catch (err) {
      console.error('Failed to send message:', err);
      
      // Remove temporary message on error
      setMessages(messages);
      setError(err.response?.data?.message || 'Failed to get a response. Please try again.');
    } finally {
      setSending(false);
    }
  };

  /**
   * Handle closing signup prompt
   */
  const handleClosePrompt = () => {
    setShowSignupPrompt(false);
  };

  /**
   * Start a new conversation (for authenticated users)
   */
  const handleNewChat = () => {
    setCurrentChatId(null);
    setMessages([]);
    setError(null);
  };

  /**
   * Format date for display
   */
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  // Calculate remaining messages for anonymous users
  const remainingMessages = isAuthenticated 
    ? (user?.subscription === 'premium' ? Infinity : user?.usage?.remaining || 5)
    : Math.max(0, FREE_MESSAGE_LIMIT - messageCount);

  return (
    <div className="h-screen bg-scripture-cream flex overflow-hidden">
      {/* Sidebar for authenticated users */}
      {isAuthenticated && (
        <>
          {/* Desktop Sidebar */}
          <aside 
            className={`hidden md:flex flex-col bg-scripture-navy text-white transition-all duration-300 ${
              sidebarOpen ? 'w-72' : 'w-0'
            } overflow-hidden`}
          >
            <div className="flex-shrink-0 p-4 border-b border-white/10">
              <button
                onClick={handleNewChat}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 
                         rounded-lg transition-colors text-white font-medium"
              >
                <span className="text-lg">+</span>
                New Chat
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3">
              <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider px-2 mb-3">
                Chat History
              </h3>
              
              {historyLoading ? (
                <div className="text-center py-4 text-white/50">Loading...</div>
              ) : chatHistory.length === 0 ? (
                <div className="text-center py-4 text-white/50 text-sm px-2">
                  No conversations yet. Start chatting to save your history!
                </div>
              ) : (
                <div className="space-y-1">
                  {chatHistory.map((chat) => (
                    <button
                      key={chat.id}
                      onClick={() => loadChat(chat.id)}
                      className={`w-full text-left p-3 rounded-lg transition-colors group ${
                        currentChatId === chat.id
                          ? 'bg-scripture-gold/20 text-scripture-gold'
                          : 'hover:bg-white/10 text-white/80'
                      }`}
                    >
                      <div className="font-medium truncate text-sm">
                        {chat.title}
                      </div>
                      <div className="text-xs text-white/40 mt-1 flex justify-between">
                        <span>{chat.messageCount} msgs</span>
                        <span>{formatDate(chat.lastActivity)}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Sidebar footer */}
            <div className="flex-shrink-0 p-3 border-t border-white/10">
              <Link 
                to="/dashboard" 
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 transition-colors"
              >
                <div className="w-8 h-8 bg-scripture-gold/20 rounded-full flex items-center justify-center">
                  <span className="text-scripture-gold text-sm">
                    {user?.name?.[0] || user?.email?.[0] || '?'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    {user?.name || 'My Account'}
                  </div>
                  <div className="text-xs text-white/50 truncate">
                    {user?.email}
                  </div>
                </div>
              </Link>
            </div>
          </aside>

          {/* Mobile Sidebar Overlay */}
          {mobileSidebarOpen && (
            <div 
              className="md:hidden fixed inset-0 bg-black/50 z-40"
              onClick={() => setMobileSidebarOpen(false)}
            />
          )}

          {/* Mobile Sidebar */}
          <aside 
            className={`md:hidden fixed inset-y-0 left-0 z-50 w-72 bg-scripture-navy text-white transform transition-transform duration-300 ${
              mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            <div className="flex-shrink-0 p-4 border-b border-white/10 flex items-center justify-between">
              <span className="font-display text-lg">ScriptureChat</span>
              <button
                onClick={() => setMobileSidebarOpen(false)}
                className="p-2 hover:bg-white/10 rounded-lg"
              >
                ✕
              </button>
            </div>
            
            <div className="p-4">
              <button
                onClick={() => {
                  handleNewChat();
                  setMobileSidebarOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 
                         rounded-lg transition-colors text-white font-medium"
              >
                <span className="text-lg">+</span>
                New Chat
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3">
              <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider px-2 mb-3">
                Chat History
              </h3>
              
              {historyLoading ? (
                <div className="text-center py-4 text-white/50">Loading...</div>
              ) : chatHistory.length === 0 ? (
                <div className="text-center py-4 text-white/50 text-sm px-2">
                  No conversations yet.
                </div>
              ) : (
                <div className="space-y-1">
                  {chatHistory.map((chat) => (
                    <button
                      key={chat.id}
                      onClick={() => {
                        loadChat(chat.id);
                        setMobileSidebarOpen(false);
                      }}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        currentChatId === chat.id
                          ? 'bg-scripture-gold/20 text-scripture-gold'
                          : 'hover:bg-white/10 text-white/80'
                      }`}
                    >
                      <div className="font-medium truncate text-sm">
                        {chat.title}
                      </div>
                      <div className="text-xs text-white/40 mt-1">
                        {formatDate(chat.lastActivity)}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-3 border-t border-white/10">
              <Link 
                to="/dashboard" 
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 transition-colors"
                onClick={() => setMobileSidebarOpen(false)}
              >
                <div className="w-8 h-8 bg-scripture-gold/20 rounded-full flex items-center justify-center">
                  <span className="text-scripture-gold text-sm">
                    {user?.name?.[0] || user?.email?.[0] || '?'}
                  </span>
                </div>
                <span className="text-sm">My Account</span>
              </Link>
            </div>
          </aside>
        </>
      )}

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white shadow-soft flex-shrink-0">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {/* Sidebar toggle for authenticated users */}
              {isAuthenticated && (
                <>
                  {/* Desktop toggle */}
                  <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="hidden md:flex p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
                  >
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
                  {/* Mobile toggle */}
                  <button
                    onClick={() => setMobileSidebarOpen(true)}
                    className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
                </>
              )}
              
              <div className="w-10 h-10 bg-scripture-navy rounded-lg flex items-center justify-center">
                <span className="text-white text-xl">✝</span>
              </div>
              <h1 className="text-xl font-display text-scripture-navy">
                ScriptureChat
              </h1>
            </div>
            
            <nav className="flex items-center space-x-3">
              {isAuthenticated ? (
                <Link to="/dashboard" className="btn-text text-sm md:hidden">
                  Account
                </Link>
              ) : (
                <>
                  <Link to="/login" className="btn-text">
                    Sign In
                  </Link>
                  <Link to="/signup" className="btn-primary py-2 px-4">
                    Subscribe 
                  </Link>
                </>
              )}
            </nav>
          </div>
        </header>

        {/* Main chat area */}
        <main className="flex-1 flex flex-col max-w-4xl mx-auto w-full min-h-0">
          {/* Messages area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
            {/* Welcome message when empty */}
            {messages.length === 0 && !sending && (
              <div className="flex flex-col items-center justify-center text-center px-4 py-4">
                <div className="w-16 h-16 bg-scripture-gold/20 rounded-full flex items-center justify-center mb-4">
                  <span className="text-3xl">📖</span>
                </div>
                <h2 className="text-2xl font-display text-scripture-navy mb-2">
                  Ask About Scripture
                </h2>
                <p className="text-lg text-gray-600 max-w-lg mb-4">
                  I'm here to help you explore the Bible and grow in your understanding 
                  of God's Word. Ask me anything about scripture!
                </p>
                
                {/* Suggested questions */}
                <div className="w-full max-w-lg space-y-2">
                  <p className="text-sm text-gray-500 mb-2">Try asking:</p>
                  {[
                    "What does John 3:16 mean?",
                    "Explain the parable of the Good Samaritan",
                    "What does the Bible say about forgiveness?",
                    "Who was King David?"
                  ].map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSendMessage(suggestion)}
                      className="w-full text-left px-4 py-3 bg-white rounded-xl border-2 border-gray-200 
                               text-base hover:border-scripture-gold hover:bg-scripture-gold/5 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Chat messages */}
            {messages.map((message, index) => (
              <ChatBubble
                key={message.id || index}
                message={message}
              />
            ))}

            {/* Sending indicator - only show when not streaming (streaming shows in the message itself) */}
            {sending && !streaming && (
              <div className="chat-bubble-assistant">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-scripture-gold rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-scripture-gold rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-scripture-gold rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  <span className="ml-2 text-gray-500">Thinking about your question...</span>
                </div>
              </div>
            )}

            {/* Scroll anchor */}
            <div ref={messagesEndRef} />
          </div>

          {/* Error message */}
          {error && (
            <div className="mx-4 mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex-shrink-0">
              {error}
              <button 
                onClick={() => setError(null)}
                className="ml-2 text-red-500 hover:text-red-700 font-medium"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Messages remaining indicator */}
          {!isAuthenticated && messages.length > 0 && (
            <div className="mx-4 mb-2 text-center flex-shrink-0">
              <span className="text-sm text-gray-500">
                {remainingMessages > 0 ? (
                  <>
                    <span className="font-medium text-scripture-navy">{remainingMessages}</span>  
                    {remainingMessages === 1 ? ' free question' : ' free questions'} remaining
                    {' • '}
                    <Link to="/signup" className="text-scripture-navy underline hover:text-primary-600">
                      Get unlimited access
                    </Link>
                  </>
                ) : (
                  <Link to="/signup" className="text-scripture-navy font-medium underline">
                    Get unlimited access for $4.99/month
                  </Link>
                )}
              </span>
            </div>
          )}

          {/* Chat input */}
          <div className="flex-shrink-0 pb-4">
            <ChatInput 
              onSend={handleSendMessage} 
              disabled={sending || streaming || (!isAuthenticated && remainingMessages <= 0)}
              placeholder={
                streaming
                  ? "Receiving response..."
                  : !isAuthenticated && remainingMessages <= 0
                  ? "Subscribe to continue asking questions..."
                  : "Ask a question about scripture..."
              }
            />
            
            {/* Footer links */}
            <div className="text-center mt-3 text-xs text-gray-400">
              <Link to="/privacy" className="hover:text-gray-600 transition-colors">Privacy Policy</Link>
              <span className="mx-2">•</span>
              <Link to="/terms" className="hover:text-gray-600 transition-colors">Terms of Service</Link>
            </div>
          </div>

          {/* Payment prompt modal */}
          {showSignupPrompt && (
            <SignupPrompt
              onClose={handleClosePrompt}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default Home;
