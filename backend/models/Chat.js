/**
 * Chat Model
 * Stores conversation history between users and the AI
 */

const mongoose = require('mongoose');

// Schema for individual messages within a chat
const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: [10000, 'Message content cannot exceed 10000 characters']
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  // Optional feedback on AI responses
  feedback: {
    type: String,
    enum: ['helpful', 'not_helpful', null],
    default: null
  }
}, { _id: true });

// Main chat/conversation schema
const chatSchema = new mongoose.Schema({
  // Reference to the user who owns this chat
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Chat title (auto-generated from first message or custom)
  title: {
    type: String,
    default: 'New Conversation',
    maxlength: [200, 'Chat title cannot exceed 200 characters'],
    trim: true
  },
  
  // Array of messages in the conversation
  messages: [messageSchema],
  
  // Chat metadata
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Track the last activity for sorting
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// ===========================================
// Indexes for better query performance
// ===========================================
chatSchema.index({ user: 1, lastActivity: -1 });
chatSchema.index({ user: 1, createdAt: -1 });
chatSchema.index({ user: 1, isActive: 1 });

// ===========================================
// Pre-save middleware
// ===========================================

// Update lastActivity whenever chat is modified
chatSchema.pre('save', function(next) {
  this.lastActivity = new Date();
  next();
});

// Auto-generate title from first user message if not set
chatSchema.pre('save', function(next) {
  if (this.title === 'New Conversation' && this.messages.length > 0) {
    const firstUserMessage = this.messages.find(m => m.role === 'user');
    if (firstUserMessage) {
      // Take first 50 characters of the first message as title
      let title = firstUserMessage.content.substring(0, 50);
      if (firstUserMessage.content.length > 50) {
        title += '...';
      }
      this.title = title;
    }
  }
  next();
});

// ===========================================
// Instance Methods
// ===========================================

/**
 * Add a message to the chat
 * @param {string} role - 'user' or 'assistant'
 * @param {string} content - Message content
 * @returns {object} - The added message
 */
chatSchema.methods.addMessage = async function(role, content) {
  const message = {
    role,
    content,
    timestamp: new Date()
  };
  
  this.messages.push(message);
  await this.save();
  
  return this.messages[this.messages.length - 1];
};

/**
 * Add feedback to a specific message
 * @param {string} messageId - ID of the message
 * @param {string} feedback - 'helpful' or 'not_helpful'
 */
chatSchema.methods.addFeedback = async function(messageId, feedback) {
  const message = this.messages.id(messageId);
  if (message && message.role === 'assistant') {
    message.feedback = feedback;
    await this.save();
    return true;
  }
  return false;
};

/**
 * Get messages formatted for OpenAI API
 * @param {number} limit - Max number of recent messages to include
 * @returns {array} - Array of {role, content} objects
 */
chatSchema.methods.getMessagesForAPI = function(limit = 20) {
  // Get recent messages for context (limit to prevent token overflow)
  const recentMessages = this.messages.slice(-limit);
  
  return recentMessages.map(msg => ({
    role: msg.role,
    content: msg.content
  }));
};

/**
 * Soft delete the chat (mark as inactive)
 */
chatSchema.methods.softDelete = async function() {
  this.isActive = false;
  await this.save();
};

// ===========================================
// Static Methods
// ===========================================

/**
 * Get all active chats for a user, sorted by last activity
 * @param {ObjectId} userId - User's ID
 * @param {number} limit - Max number of chats to return
 * @returns {array} - Array of chat documents
 */
chatSchema.statics.getUserChats = function(userId, limit = 50) {
  return this.find({ 
    user: userId, 
    isActive: true 
  })
  .select('title lastActivity createdAt messages')
  .sort({ lastActivity: -1 })
  .limit(limit)
  .lean();
};

/**
 * Get a specific chat with all messages
 * @param {ObjectId} chatId - Chat's ID
 * @param {ObjectId} userId - User's ID (for security)
 * @returns {object} - Chat document or null
 */
chatSchema.statics.getChatById = function(chatId, userId) {
  return this.findOne({ 
    _id: chatId, 
    user: userId,
    isActive: true 
  });
};

/**
 * Create a new chat for a user
 * @param {ObjectId} userId - User's ID
 * @param {string} initialMessage - First message content
 * @returns {object} - New chat document
 */
chatSchema.statics.createChat = async function(userId, initialMessage = null) {
  const chat = new this({
    user: userId,
    messages: initialMessage ? [{
      role: 'user',
      content: initialMessage,
      timestamp: new Date()
    }] : []
  });
  
  await chat.save();
  return chat;
};

/**
 * Delete all chats for a user (for account deletion)
 * @param {ObjectId} userId - User's ID
 */
chatSchema.statics.deleteAllUserChats = function(userId) {
  return this.updateMany(
    { user: userId },
    { isActive: false }
  );
};

const Chat = mongoose.model('Chat', chatSchema);

module.exports = Chat;
