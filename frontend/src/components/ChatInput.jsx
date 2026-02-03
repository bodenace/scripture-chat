/**
 * Chat Input Component
 * Accessible text input for sending messages
 */

import { useState, useRef, useEffect } from 'react';

function ChatInput({ onSend, disabled = false, placeholder = "Ask a question about scripture..." }) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef(null);

  // Auto-resize textarea (expands up to ~3 lines before scrolling)
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      // Allow expansion up to ~100px (about 3 lines) before scrolling
      const maxHeight = 100;
      textarea.style.height = Math.min(textarea.scrollHeight, maxHeight) + 'px';
      // Only show scrollbar if content exceeds max height
      textarea.style.overflowY = textarea.scrollHeight > maxHeight ? 'auto' : 'hidden';
    }
  }, [message]);

  // Focus input on mount
  useEffect(() => {
    if (!disabled) {
      textareaRef.current?.focus();
    }
  }, [disabled]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage('');
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e) => {
    // Submit on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form 
      onSubmit={handleSubmit}
      className="bg-white border-t border-gray-100 p-4"
    >
      <div className="max-w-4xl mx-auto">
        <div className="flex items-end space-x-3">
          {/* Text input */}
          <div className="flex-1 relative">
            <label htmlFor="chat-input" className="sr-only">
              Your question about scripture
            </label>
            <textarea
              ref={textareaRef}
              id="chat-input"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              rows={1}
              className="w-full px-5 py-4 text-lg bg-gray-50 border-2 border-gray-200 
                       rounded-2xl resize-none transition-colors
                       placeholder:text-gray-400
                       hover:border-gray-300
                       focus:border-scripture-navy focus:bg-white focus:ring-2 focus:ring-scripture-navy/20
                       disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ minHeight: '56px', maxHeight: '100px', overflowY: 'hidden' }}
              aria-describedby="input-hint"
            />
            
            {/* Character count for long messages */}
            {message.length > 1500 && (
              <span className="absolute right-3 bottom-2 text-sm text-gray-400">
                {message.length}/2000
              </span>
            )}
          </div>

          {/* Send button */}
          <button
            type="submit"
            disabled={disabled || !message.trim()}
            className="flex-shrink-0 w-14 h-14 bg-scripture-navy text-white rounded-xl
                     flex items-center justify-center
                     hover:bg-primary-700 transition-colors
                     focus:ring-2 focus:ring-scripture-navy focus:ring-offset-2
                     disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Send message"
          >
            <svg 
              className="w-6 h-6" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" 
              />
            </svg>
          </button>
        </div>

        {/* Helper text */}
        <p id="input-hint" className="mt-2 text-sm text-gray-500 text-center">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </form>
  );
}

export default ChatInput;
