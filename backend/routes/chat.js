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

// System prompt for Latter-day Saint scripture focus
const SYSTEM_PROMPT = `You are a wise and compassionate Latter-day Saint gospel scholar named "Faith Guide." Your role is to help people understand and apply the teachings of The Church of Jesus Christ of Latter-day Saints to their lives.

IMPORTANT GUIDELINES:
1. Answer ONLY questions related to Latter-day Saint theology, scripture, faith, gospel principles, and Christian living within an LDS context.
2. If someone asks a question unrelated to the gospel or Latter-day Saint teachings, politely redirect them: "I'm here to help with questions about the restored gospel and Latter-day Saint scripture. Would you like to explore what the scriptures or latter-day prophets have taught about a particular topic?"
3. Draw from ALL four standard works: the Bible (KJV preferred), the Book of Mormon, the Doctrine and Covenants, and the Pearl of Great Price. Also reference teachings from General Conference, latter-day prophets, and apostles when relevant.
4. ALWAYS include relevant scripture references with citations (book, chapter:verse). For example: "For behold, this is my work and my glory—to bring to pass the immortality and eternal life of man" (Moses 1:39).
5. Keep responses encouraging, non-judgmental, and faithful to the teachings of The Church of Jesus Christ of Latter-day Saints.
6. Be warm and uplifting in tone — remember you're speaking with people seeking spiritual guidance and a stronger testimony.
7. When discussing gospel topics, present teachings consistent with official Church positions and the words of living prophets.
8. Encourage personal revelation, prayer, temple worship, scripture study, and following the counsel of Church leaders.
9. When appropriate, reference the Plan of Salvation, the Atonement of Jesus Christ, the Restoration, priesthood authority, and other core Latter-day Saint doctrines.
10. Keep responses clear and accessible — avoid overly academic language. Use the language of the gospel that members would be familiar with.
11. When citing the Bible, prefer the King James Version (KJV). When citing the Book of Mormon, D&C, or Pearl of Great Price, use the standard LDS editions.
12. Bear testimony when appropriate and invite others to seek confirmation through the Holy Ghost.

Remember: You are a servant of the Lord, helping people grow in their testimony and understanding of the restored gospel of Jesus Christ.`;

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
      { reference: '1 Nephi 3:7', text: 'I will go and do the things which the Lord hath commanded, for I know that the Lord giveth no commandments unto the children of men, save he shall prepare a way for them that they may accomplish the thing which he commandeth them.' },
      { reference: '2 Nephi 2:25', text: 'Adam fell that men might be; and men are, that they might have joy.' },
      { reference: '2 Nephi 31:20', text: 'Wherefore, ye must press forward with a steadfastness in Christ, having a perfect brightness of hope, and a love of God and of all men.' },
      { reference: 'Alma 32:21', text: 'Faith is not to have a perfect knowledge of things; therefore if ye have faith ye hope for things which are not seen, which are true.' },
      { reference: 'Moroni 10:4-5', text: 'And when ye shall receive these things, I would exhort you that ye would ask God, the Eternal Father, in the name of Christ, if these things are not true; and if ye shall ask with a sincere heart, with real intent, having faith in Christ, he will manifest the truth of it unto you, by the power of the Holy Ghost.' },
      { reference: 'Mosiah 2:17', text: 'When ye are in the service of your fellow beings ye are only in the service of your God.' },
      { reference: 'Ether 12:27', text: 'And if men come unto me I will show unto them their weakness. I give unto men weakness that they may be humble; and my grace is sufficient for all men that humble themselves before me.' },
      { reference: 'D&C 6:36', text: 'Look unto me in every thought; doubt not, fear not.' },
      { reference: 'D&C 58:42', text: 'Behold, he who has repented of his sins, the same is forgiven, and I, the Lord, remember them no more.' },
      { reference: 'D&C 121:7-8', text: 'My son, peace be unto thy soul; thine adversity and thine afflictions shall be but a small moment; And then, if thou endure it well, God shall exalt thee on high.' },
      { reference: 'Moses 1:39', text: 'For behold, this is my work and my glory—to bring to pass the immortality and eternal life of man.' },
      { reference: 'Mosiah 4:9', text: 'Believe in God; believe that he is, and that he created all things, both in heaven and in earth; believe that he has all wisdom, and all power, both in heaven and in earth.' },
      { reference: 'Alma 37:37', text: 'Counsel with the Lord in all thy doings, and he will direct thee for good.' },
      { reference: 'D&C 82:10', text: 'I, the Lord, am bound when ye do what I say; but when ye do not what I say, ye have no promise.' },
      { reference: '3 Nephi 11:29', text: 'For verily, verily I say unto you, he that hath the spirit of contention is not of me, but is of the devil.' },
      { reference: 'John 3:16', text: 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.' },
      { reference: 'Proverbs 3:5-6', text: 'Trust in the Lord with all thine heart; and lean not unto thine own understanding. In all thy ways acknowledge him, and he shall direct thy paths.' },
      { reference: 'Philippians 4:13', text: 'I can do all things through Christ which strengtheneth me.' }
    ];

    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
    const verse = verses[dayOfYear % verses.length];

    res.json({
      success: true,
      data: {
        verse: {
          reference: verse.reference,
          text: verse.text,
          version: 'KJV'
        }
      }
    });

  } catch (error) {
    console.error('Verse of day error:', error);
    res.json({
      success: true,
      data: {
        verse: {
          reference: '1 Nephi 3:7',
          text: 'I will go and do the things which the Lord hath commanded, for I know that the Lord giveth no commandments unto the children of men, save he shall prepare a way for them.',
          version: 'KJV'
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
        : 'Sorry, I encountered an issue. Please try rephrasing your gospel question.';

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
        'I apologize, but I was unable to generate a response. Please try rephrasing your gospel question.';

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
        'Sorry, I encountered an issue. Please try rephrasing your gospel question.',
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
        'I apologize, but I was unable to generate a response. Please try rephrasing your gospel question.';

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
        'Sorry, I encountered an issue while thinking about your question. Please try rephrasing your gospel question.',
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
