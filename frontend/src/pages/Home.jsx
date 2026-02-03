/**
 * Home Page
 * Main chat interface - accessible to everyone
 * Prompts account creation after 5 free messages
 */

import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import ChatInput from '../components/ChatInput';
import ChatBubble from '../components/ChatBubble';
import SignupPrompt from '../components/SignupPrompt';

// Number of free messages before requiring signup
const FREE_MESSAGE_LIMIT = 2;
const STORAGE_KEY = 'scripturechat_anonymous_usage';

function Home() {
  const { user, isAuthenticated, refreshUser } = useAuth();
  const navigate = useNavigate();
  
  // State
  const [messages, setMessages] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null); // Track current chat for authenticated users
  const [chatHistory, setChatHistory] = useState([]); // List of past conversations
  const [showHistory, setShowHistory] = useState(false); // Toggle history sidebar
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
        setShowHistory(false);
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
    setShowHistory(false);
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
    <div className="h-screen bg-scripture-cream flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-white shadow-soft flex-shrink-0">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-scripture-navy rounded-lg flex items-center justify-center">
              <span className="text-white text-xl">✝</span>
            </div>
            <h1 className="text-xl font-display text-scripture-navy">
              ScriptureChat
            </h1>
          </div>
          
          <nav className="flex items-center space-x-3">
            {isAuthenticated ? (
              <>
                <button
                  onClick={handleNewChat}
                  className="btn-text text-sm"
                  title="Start a new conversation"
                >
                  + New Chat
                </button>
                <button
                  onClick={() => {
                    setShowHistory(!showHistory);
                    if (!showHistory) fetchChatHistory();
                  }}
                  className="btn-text text-sm"
                  title="View chat history"
                >
                  History
                </button>
                <span className="text-sm text-gray-600 hidden sm:inline">
                  {user?.name || user?.email}
                </span>
                <Link to="/dashboard" className="btn-text">
                  My Account
                </Link>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-text">
                  Sign In
                </Link>
                <Link to="/signup" className="btn-primary py-2 px-4">
                  Subscribe - $4.99/mo
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Chat History Panel */}
      {isAuthenticated && showHistory && (
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-4xl mx-auto p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-scripture-navy">Your Conversations</h3>
              <button 
                onClick={() => setShowHistory(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            {historyLoading ? (
              <div className="text-center py-4 text-gray-500">Loading...</div>
            ) : chatHistory.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                No previous conversations yet. Start chatting to save your history!
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {chatHistory.map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => loadChat(chat.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      currentChatId === chat.id
                        ? 'bg-scripture-gold/10 border-scripture-gold'
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <div className="font-medium text-scripture-navy truncate">
                      {chat.title}
                    </div>
                    <div className="text-sm text-gray-500 flex justify-between mt-1">
                      <span>{chat.messageCount} messages</span>
                      <span>{formatDate(chat.lastActivity)}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

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
        <div className="flex-shrink-0">
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
        </div>
      </main>

      {/* Payment prompt modal */}
      {showSignupPrompt && (
        <SignupPrompt
          onClose={handleClosePrompt}
        />
      )}
    </div>
  );
}

export default Home;
