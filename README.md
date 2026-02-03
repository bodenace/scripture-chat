# ScriptureChat

Biblical wisdom at your fingertips. ScriptureChat is a full-stack web application that helps users explore the Bible and Christian teachings through an AI-powered conversational interface.

## Features

- **Scripture-Focused AI Chat**: Ask questions about the Bible, get explanations with verse citations
- **User Authentication**: Email/password signup and Google OAuth
- **Subscription Plans**: Free tier (5 questions/day) and Premium ($4.99/month unlimited)
- **Chat History**: Save and revisit past conversations
- **Verse of the Day**: Daily scripture inspiration
- **Accessible Design**: Optimized for adults 55+ with large fonts and high contrast
- **Edge Browser Optimized**: Full compatibility with Microsoft Edge

## Tech Stack

### Frontend
- React.js 18 with Vite
- Tailwind CSS for styling
- React Router for navigation
- Axios for API calls

### Backend
- Node.js with Express.js
- MongoDB with Mongoose ODM
- Passport.js for authentication
- OpenAI API (GPT-4) for AI responses
- Stripe for payments

## Project Structure

```
scripturechat/
├── backend/
│   ├── config/
│   │   └── passport.js          # Auth strategies
│   ├── middleware/
│   │   ├── auth.js              # JWT protection
│   │   ├── errorHandler.js      # Error handling
│   │   └── rateLimiter.js       # Rate limiting
│   ├── models/
│   │   ├── User.js              # User schema
│   │   └── Chat.js              # Chat schema
│   ├── routes/
│   │   ├── auth.js              # Auth endpoints
│   │   ├── chat.js              # Chat endpoints
│   │   └── stripe.js            # Payment endpoints
│   ├── server.js                # Express app
│   └── package.json
├── frontend/
│   ├── public/
│   │   ├── manifest.json        # PWA manifest
│   │   └── cross.svg            # App icon
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatBubble.jsx
│   │   │   ├── ChatInput.jsx
│   │   │   ├── Layout.jsx
│   │   │   ├── LoadingSpinner.jsx
│   │   │   └── Sidebar.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── AuthCallback.jsx
│   │   │   ├── Chat.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Home.jsx
│   │   │   ├── Login.jsx
│   │   │   └── Signup.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
├── env.example                   # Environment variables template
├── package.json                  # Root package.json
└── README.md
```

## Setup Instructions

### Prerequisites

- Node.js 18+ installed
- MongoDB instance (local or Atlas)
- OpenAI API key
- Stripe account (for payments)
- Google Cloud Console project (for OAuth, optional)

### 1. Clone and Install Dependencies

```bash
# Navigate to project directory
cd scripturechat

# Install all dependencies (root, backend, and frontend)
npm run install:all

# Or install separately:
npm install
cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure Environment Variables

Copy `env.example` to `.env` in the backend folder:

```bash
cp env.example backend/.env
```

Edit `backend/.env` with your values:

```env
# Server
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5173

# MongoDB
MONGODB_URI=mongodb://localhost:27017/scripturechat

# JWT
JWT_SECRET=your-secure-random-string-here
JWT_EXPIRES_IN=7d

# OpenAI - Get your key from https://platform.openai.com
OPENAI_API_KEY=sk-your-openai-api-key

# Google OAuth (optional) - https://console.cloud.google.com
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# Stripe - https://dashboard.stripe.com/test/apikeys
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-publishable-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
STRIPE_PRICE_ID=price_your-price-id

# Rate Limiting
FREE_TIER_DAILY_LIMIT=5
```

### 3. Set Up Stripe (for payments)

1. Create a Stripe account at https://stripe.com
2. Go to Products and create a new product:
   - Name: "ScriptureChat Premium"
   - Price: $4.99/month recurring
3. Copy the Price ID to `STRIPE_PRICE_ID`
4. Set up webhook endpoint:
   - URL: `https://your-domain.com/api/stripe/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.*`, `invoice.*`
5. Copy webhook signing secret to `STRIPE_WEBHOOK_SECRET`

### 4. Set Up Google OAuth (optional)

1. Go to Google Cloud Console
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:5000/api/auth/google/callback`
6. Copy Client ID and Secret to environment variables

### 5. Start MongoDB

```bash
# Local MongoDB
mongod

# Or use MongoDB Atlas connection string in MONGODB_URI
```

### 6. Run the Application

```bash
# Start both frontend and backend in development mode
npm run dev

# Or start separately:
npm run dev:backend   # Backend on http://localhost:5000
npm run dev:frontend  # Frontend on http://localhost:5173
```

### 7. Access the Application

Open http://localhost:5173 in your browser (optimized for Microsoft Edge).

## Deployment

### Frontend (Vercel/Netlify)

1. Build the frontend:
   ```bash
   cd frontend
   npm run build
   ```

2. Deploy the `dist` folder to Vercel or Netlify

3. Set environment variable:
   ```
   VITE_API_URL=https://your-backend-url.com/api
   ```

### Backend (Heroku/Render)

1. Create a new app on Heroku or Render

2. Set all environment variables from `.env`

3. Deploy using Git:
   ```bash
   # Heroku
   heroku git:remote -a your-app-name
   git subtree push --prefix backend heroku main

   # Render - connect your repository
   ```

4. Update `FRONTEND_URL` to your deployed frontend URL

5. Update Stripe webhook URL to your deployed backend

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `GET /api/auth/google` - Google OAuth

### Chat
- `GET /api/chat/history` - Get chat history
- `GET /api/chat/:chatId` - Get specific chat
- `POST /api/chat/new` - Create new chat
- `POST /api/chat/:chatId/message` - Send message
- `POST /api/chat/quick` - Quick message (new chat)
- `DELETE /api/chat/:chatId` - Delete chat
- `GET /api/chat/verse-of-day` - Get daily verse

### Payments
- `GET /api/stripe/plans` - Get subscription plans
- `POST /api/stripe/create-checkout-session` - Start checkout
- `POST /api/stripe/create-portal-session` - Manage subscription
- `GET /api/stripe/subscription-status` - Get status
- `POST /api/stripe/webhook` - Stripe webhooks

## Accessibility Features

- Large fonts (18px base, 24px+ headings)
- High contrast color scheme
- Keyboard navigation support
- Screen reader compatible
- Clear focus indicators
- Minimal animations
- Text labels on all buttons

## Browser Support

- Microsoft Edge (primary, fully optimized)
- Google Chrome
- Mozilla Firefox
- Safari

## License

MIT License - See LICENSE file for details.

## Support

For questions or issues, contact: support@scripturechat.com

---

Built with faith and code. May this tool help you grow in your understanding of God's Word.
