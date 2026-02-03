/**
 * Chat Bubble Component
 * Displays individual messages with formatting and feedback options
 */

import { useState } from 'react';

function ChatBubble({ message, onFeedback }) {
  const { id, role, content, timestamp, feedback, isStreaming } = message;
  const [showFeedback, setShowFeedback] = useState(false);

  const isUser = role === 'user';

  /**
   * Format timestamp for display
   */
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  /**
   * Format message content with Bible verse highlighting
   */
  const formatContent = (text) => {
    if (isUser) return text;

    // Split by quoted sections (Bible verses)
    const parts = text.split(/(".*?"(?:\s*-\s*[\w\s]+\d+:\d+(?:-\d+)?(?:\s+\w+)?)?)/g);

    return parts.map((part, index) => {
      // Check if this part looks like a Bible verse quote
      if (part.startsWith('"') && (
        part.includes(' - ') || 
        /\d+:\d+/.test(part)
      )) {
        return (
          <span key={index} className="verse-highlight block my-3">
            {part}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div 
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}
    >
      <div className={`max-w-[85%] ${isUser ? 'order-2' : 'order-1'}`}>
        {/* Message bubble */}
        <div 
          className={isUser ? 'chat-bubble-user' : 'chat-bubble-assistant'}
          role="article"
          aria-label={`${isUser ? 'Your' : 'ScriptureChat'} message`}
        >
          {/* Message content */}
          <div className="text-lg leading-relaxed whitespace-pre-wrap">
            {formatContent(content)}
            {/* Typing cursor while streaming */}
            {isStreaming && (
              <span className="inline-block w-2 h-5 bg-scripture-navy ml-1 animate-pulse" />
            )}
          </div>
        </div>

        {/* Message metadata and actions */}
        <div className={`mt-2 flex items-center space-x-3 text-sm text-gray-500 ${isUser ? 'justify-end' : 'justify-start'}`}>
          {/* Timestamp */}
          {timestamp && (
            <time dateTime={timestamp}>
              {formatTime(timestamp)}
            </time>
          )}

          {/* Feedback buttons for assistant messages */}
          {!isUser && onFeedback && (
            <div className="flex items-center space-x-1">
              {feedback ? (
                <span className="text-gray-400">
                  {feedback === 'helpful' ? '👍 Helpful' : '👎 Not helpful'}
                </span>
              ) : (
                <>
                  <span className="text-gray-400 mr-1">Was this helpful?</span>
                  <button
                    onClick={() => onFeedback(id, 'helpful')}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                    aria-label="Mark as helpful"
                    title="Helpful"
                  >
                    👍
                  </button>
                  <button
                    onClick={() => onFeedback(id, 'not_helpful')}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                    aria-label="Mark as not helpful"
                    title="Not helpful"
                  >
                    👎
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Avatar */}
      <div className={`flex-shrink-0 ${isUser ? 'order-1 mr-3' : 'order-2 ml-3'}`}>
        <div 
          className={`w-10 h-10 rounded-full flex items-center justify-center text-white
            ${isUser ? 'bg-scripture-gold' : 'bg-scripture-navy'}`}
          aria-hidden="true"
        >
          {isUser ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
          ) : (
            <span className="text-lg">✝</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default ChatBubble;
