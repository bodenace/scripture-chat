/**
 * Chat Routes
 * Handles conversations and OpenAI integration
 */

const express = require('express');
const router = express.Router();
const { body, validationResult, param } = require('express-validator');
const OpenAI = require('openai');
const Chat = require('../models/Chat');
const { protect, checkQuestionLimit } = require('../middleware/auth');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');
const { chatLimiter } = require('../middleware/rateLimiter');

// ===========================================
// OpenAI Configuration
// ===========================================
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'sk-placeholder-key'
});

// System prompt for Christian scripture focus
const SYSTEM_PROMPT = `You are a wise and compassionate Christian scholar named "ScriptureGuide." Your role is to help people understand and apply Biblical teachings to their lives.

IMPORTANT GUIDELINES:
1. Answer ONLY questions related to the Bible, Christian scripture, faith, theology, and Christian living.
2. If someone asks a question unrelated to Christianity or scripture, politely redirect them: "I'm here to help with questions about the Bible and Christian faith. Would you like to explore what scripture says about a particular topic?"
3. ALWAYS include relevant Bible verses with citations (book, chapter:verse) using versions like NIV, ESV, or KJV.
4. Keep responses encouraging, non-judgmental, and faithful to orthodox Christian teachings.
5. Be warm and pastoral in tone - remember you're speaking with people seeking spiritual guidance.
6. When interpreting difficult passages, acknowledge different perspectives within mainstream Christianity when appropriate.
7. Format Bible verses in quotation marks with the reference after (e.g., "For God so loved the world..." - John 3:16 NIV).
8. If asked about controversial topics, present the traditional Biblical perspective with grace and love.
9. Encourage prayer and relationship with God.
10. Keep responses clear and accessible - avoid overly academic language.

Remember: You are a servant of God's Word, helping people grow in their faith and understanding of scripture.`;

// ===========================================
// Validation Rules
// ===========================================
const messageValidation = [
  body('message')
    .trim()
    .notEmpty()
    .withMessage('Please enter your question')
    .isLength({ max: 2000 })
    .withMessage('Message is too long. Please keep it under 2000 characters.')
];

const chatIdValidation = [
  param('chatId')
    .isMongoId()
    .withMessage('Invalid chat ID')
];

// ===========================================
// PUBLIC ROUTES (no auth required) - MUST BE FIRST
// ===========================================

/**
 * @route   GET /api/chat/verse-of-day
 * @desc    Get Bible verse of the day (public endpoint)
 * @access  Public
 */
router.get('/verse-of-day', asyncHandler(async (req, res) => {
  try {
    const verses = [
      { reference: 'John 3:16', text: 'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.' },
      { reference: 'Jeremiah 29:11', text: 'For I know the plans I have for you, declares the LORD, plans to prosper you and not to harm you, plans to give you hope and a future.' },
      { reference: 'Philippians 4:13', text: 'I can do all things through Christ who strengthens me.' },
      { reference: 'Psalm 23:1', text: 'The LORD is my shepherd; I shall not want.' },
      { reference: 'Proverbs 3:5-6', text: 'Trust in the LORD with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.' },
      { reference: 'Isaiah 41:10', text: 'So do not fear, for I am with you; do not be dismayed, for I am your God. I will strengthen you and help you; I will uphold you with my righteous right hand.' },
      { reference: 'Romans 8:28', text: 'And we know that in all things God works for the good of those who love him, who have been called according to his purpose.' },
      { reference: 'Matthew 11:28', text: 'Come to me, all you who are weary and burdened, and I will give you rest.' },
      { reference: 'Psalm 46:1', text: 'God is our refuge and strength, an ever-present help in trouble.' },
      { reference: '2 Timothy 1:7', text: 'For God has not given us a spirit of fear, but of power and of love and of a sound mind.' },
      { reference: 'Joshua 1:9', text: 'Have I not commanded you? Be strong and courageous. Do not be afraid; do not be discouraged, for the LORD your God will be with you wherever you go.' },
      { reference: 'Psalm 119:105', text: 'Your word is a lamp for my feet, a light on my path.' },
      { reference: 'Romans 15:13', text: 'May the God of hope fill you with all joy and peace as you trust in him, so that you may overflow with hope by the power of the Holy Spirit.' },
      { reference: '1 Peter 5:7', text: 'Cast all your anxiety on him because he cares for you.' },
      { reference: 'Psalm 27:1', text: 'The LORD is my light and my salvation— whom shall I fear? The LORD is the stronghold of my life— of whom shall I be afraid?' }
    ];

    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
    const verse = verses[dayOfYear % verses.length];

    res.json({
      success: true,
      data: {
        verse: {
          reference: verse.reference,
          text: verse.text,
          version: 'NIV'
        }
      }
    });

  } catch (error) {
    console.error('Verse of day error:', error);
    res.json({
      success: true,
      data: {
        verse: {
          reference: 'John 3:16',
          text: 'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.',
          version: 'NIV'
        }
      }
    });
  }
}));

/**
 * @route   POST /api/chat/anonymous
 * @desc    Anonymous chat for users without accounts (limited to 5 messages) - STREAMING
 * @access  Public
 */
router.post('/anonymous',
  chatLimiter,
  messageValidation,
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(errors.array()[0].msg, 400);
    }

    const { message, history = [] } = req.body;

    // Set headers for Server-Sent Events (streaming)
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    try {
      // Build conversation history from client-provided history
      const conversationHistory = history
        .filter(msg => msg.role && msg.content)
        .slice(-10)
        .map(msg => ({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content
        }));

      conversationHistory.push({ role: 'user', content: message });

      // Call OpenAI API with streaming
      const stream = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...conversationHistory
        ],
        max_tokens: 1000,
        temperature: 0.7,
        stream: true
      });

      let fullResponse = '';

      // Stream each chunk to the client
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          fullResponse += content;
          // Send chunk as SSE
          res.write(`data: ${JSON.stringify({ content, done: false })}\n\n`);
        }
      }

      // Send final message with done flag
      res.write(`data: ${JSON.stringify({ content: '', done: true, fullResponse, timestamp: new Date().toISOString() })}\n\n`);
      res.end();

    } catch (error) {
      console.error('OpenAI API Error (anonymous):', error);

      const errorMessage = error.code === 'insufficient_quota' 
        ? 'Service temporarily unavailable. Please try again later.'
        : error.code === 'rate_limit_exceeded'
        ? 'Too many requests. Please wait a moment and try again.'
        : 'Sorry, I encountered an issue. Please try rephrasing your scripture question.';

      res.write(`data: ${JSON.stringify({ error: errorMessage, done: true })}\n\n`);
      res.end();
    }
  })
);

// ===========================================
// PROTECTED ROUTES (auth required)
// ===========================================

/**
 * @route   GET /api/chat/history
 * @desc    Get user's chat history (sidebar)
 * @access  Private
 */
router.get('/history', protect, asyncHandler(async (req, res) => {
  const chats = await Chat.getUserChats(req.user._id, 50);

  const formattedChats = chats.map(chat => ({
    id: chat._id,
    title: chat.title,
    lastActivity: chat.lastActivity,
    messageCount: chat.messages.length,
    preview: chat.messages.length > 0 
      ? chat.messages[0].content.substring(0, 50) + '...'
      : 'Empty conversation'
  }));

  res.json({
    success: true,
    data: {
      chats: formattedChats,
      count: formattedChats.length
    }
  });
}));

/**
 * @route   POST /api/chat/new
 * @desc    Create a new chat conversation
 * @access  Private
 */
router.post('/new', protect, asyncHandler(async (req, res) => {
  const chat = await Chat.createChat(req.user._id);

  res.status(201).json({
    success: true,
    message: 'New conversation started.',
    data: {
      chat: {
        id: chat._id,
        title: chat.title,
        messages: [],
        createdAt: chat.createdAt
      }
    }
  });
}));

/**
 * @route   POST /api/chat/quick
 * @desc    Quick message without existing chat (creates new chat)
 * @access  Private
 */
router.post('/quick',
  protect,
  chatLimiter,
  checkQuestionLimit,
  messageValidation,
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(errors.array()[0].msg, 400);
    }

    const { message } = req.body;
    const chat = await Chat.createChat(req.user._id, message);

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: message }
        ],
        max_tokens: 1000,
        temperature: 0.7
      });

      const aiResponse = completion.choices[0]?.message?.content || 
        'I apologize, but I was unable to generate a response. Please try rephrasing your question about scripture.';

      await chat.addMessage('assistant', aiResponse);
      await req.user.incrementQuestionCount();

      res.status(201).json({
        success: true,
        data: {
          chat: {
            id: chat._id,
            title: chat.title,
            messages: chat.messages.map(msg => ({
              id: msg._id,
              role: msg.role,
              content: msg.content,
              timestamp: msg.timestamp
            }))
          },
          usage: {
            questionsRemaining: req.questionsRemaining,
            resetTime: req.resetTime,
            isPremium: req.user.subscription.status === 'premium'
          }
        }
      });

    } catch (error) {
      console.error('OpenAI API Error:', error);
      throw new ApiError(
        'Sorry, I encountered an issue. Please try rephrasing your scripture question.',
        500
      );
    }
  })
);

// ===========================================
// PARAMETERIZED ROUTES (must come last)
// ===========================================

/**
 * @route   GET /api/chat/:chatId
 * @desc    Get a specific chat with all messages
 * @access  Private
 */
router.get('/:chatId', protect, chatIdValidation, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(errors.array()[0].msg, 400);
  }

  const chat = await Chat.getChatById(req.params.chatId, req.user._id);

  if (!chat) {
    throw new ApiError('Chat not found.', 404);
  }

  res.json({
    success: true,
    data: {
      chat: {
        id: chat._id,
        title: chat.title,
        messages: chat.messages.map(msg => ({
          id: msg._id,
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp,
          feedback: msg.feedback
        })),
        createdAt: chat.createdAt,
        lastActivity: chat.lastActivity
      }
    }
  });
}));

/**
 * @route   POST /api/chat/:chatId/message
 * @desc    Send a message and get AI response
 * @access  Private
 */
router.post('/:chatId/message', 
  protect, 
  chatLimiter,
  checkQuestionLimit,
  chatIdValidation,
  messageValidation,
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(errors.array()[0].msg, 400);
    }

    const { message } = req.body;
    const chat = await Chat.getChatById(req.params.chatId, req.user._id);

    if (!chat) {
      throw new ApiError('Chat not found.', 404);
    }

    await chat.addMessage('user', message);

    try {
      const conversationHistory = chat.getMessagesForAPI(10);

      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...conversationHistory
        ],
        max_tokens: 1000,
        temperature: 0.7,
        presence_penalty: 0.1,
        frequency_penalty: 0.1
      });

      const aiResponse = completion.choices[0]?.message?.content || 
        'I apologize, but I was unable to generate a response. Please try rephrasing your question about scripture.';

      const assistantMessage = await chat.addMessage('assistant', aiResponse);
      await req.user.incrementQuestionCount();

      res.json({
        success: true,
        data: {
          message: {
            id: assistantMessage._id,
            role: 'assistant',
            content: aiResponse,
            timestamp: assistantMessage.timestamp
          },
          usage: {
            questionsRemaining: req.questionsRemaining,
            resetTime: req.resetTime,
            isPremium: req.user.subscription.status === 'premium'
          }
        }
      });

    } catch (error) {
      console.error('OpenAI API Error:', error);

      if (error.code === 'insufficient_quota') {
        throw new ApiError('Service temporarily unavailable. Please try again later.', 503);
      }

      if (error.code === 'rate_limit_exceeded') {
        throw new ApiError('Too many requests. Please wait a moment and try again.', 429);
      }

      throw new ApiError(
        'Sorry, I encountered an issue while thinking about your question. Please try rephrasing your scripture question.',
        500
      );
    }
  })
);

/**
 * @route   POST /api/chat/:chatId/feedback/:messageId
 * @desc    Add feedback to a message
 * @access  Private
 */
router.post('/:chatId/feedback/:messageId',
  protect,
  [
    ...chatIdValidation,
    param('messageId').isMongoId().withMessage('Invalid message ID'),
    body('feedback')
      .isIn(['helpful', 'not_helpful'])
      .withMessage('Feedback must be "helpful" or "not_helpful"')
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(errors.array()[0].msg, 400);
    }

    const chat = await Chat.getChatById(req.params.chatId, req.user._id);

    if (!chat) {
      throw new ApiError('Chat not found.', 404);
    }

    const success = await chat.addFeedback(req.params.messageId, req.body.feedback);

    if (!success) {
      throw new ApiError('Message not found or cannot add feedback to user messages.', 400);
    }

    res.json({
      success: true,
      message: 'Thank you for your feedback!'
    });
  })
);

/**
 * @route   PUT /api/chat/:chatId/title
 * @desc    Update chat title
 * @access  Private
 */
router.put('/:chatId/title',
  protect,
  chatIdValidation,
  [
    body('title')
      .trim()
      .notEmpty()
      .withMessage('Title is required')
      .isLength({ max: 200 })
      .withMessage('Title cannot exceed 200 characters')
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(errors.array()[0].msg, 400);
    }

    const chat = await Chat.getChatById(req.params.chatId, req.user._id);

    if (!chat) {
      throw new ApiError('Chat not found.', 404);
    }

    chat.title = req.body.title;
    await chat.save();

    res.json({
      success: true,
      message: 'Chat title updated.',
      data: { title: chat.title }
    });
  })
);

/**
 * @route   DELETE /api/chat/:chatId
 * @desc    Delete a chat
 * @access  Private
 */
router.delete('/:chatId', protect, chatIdValidation, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(errors.array()[0].msg, 400);
  }

  const chat = await Chat.getChatById(req.params.chatId, req.user._id);

  if (!chat) {
    throw new ApiError('Chat not found.', 404);
  }

  await chat.softDelete();

  res.json({
    success: true,
    message: 'Chat deleted successfully.'
  });
}));

module.exports = router;
