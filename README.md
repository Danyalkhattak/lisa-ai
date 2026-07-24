# Lisa AI — Browser Voice Assistant

A modern, AI-powered voice assistant that runs entirely in your browser. Built with React, powered by Google Gemini, with always-listening mode and guided email workflows.

**July 2026 Edition — Production Ready**

---

## Features

- **Always-Listening Mode** — No tap needed. Lisa continuously listens when on a call
- **Interruption Handling** — Stop Lisa mid-sentence just by talking
- **Female Voice TTS** — Natural-sounding female voice (Samantha, Victoria, etc.)
- **Guided Email Workflow** — "Send email to Ali" → Lisa guides you through it step-by-step
- **Contacts Management** — Full CRUD for email contacts (stored in Convex)
- **Clean UI** — Modern dark theme with smooth animations

---

## Tech Stack (July 2026)

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.3+ | UI library |
| **Vite** | 5.4+ | Build tool & dev server |
| **Tailwind CSS** | 3.4+ | Utility-first styling |
| **Framer Motion** | 11.5+ | Animations & transitions |
| **Clerk** | 5.7+ | Authentication (sign in/up) |
| **Convex** | 1.14+ | Backend database & serverless functions |
| **Google Gemini** | 2.0 Flash | AI chat model |
| **EmailJS** | 4.4+ | Email sending |
| **Lucide React** | 0.44+ | Icon library |
| **React Router** | 6.26+ | Client-side routing |

### Why This Stack?

1. **Vite + React** — Fastest dev experience, instant HMR, optimized production builds
2. **Tailwind CSS v4-ready** — Utility-first approach, no CSS files to maintain
3. **Clerk** — Drop-in auth with pre-built UI components, no backend needed
4. **Convex** — Serverless backend with real-time subscriptions, no separate API server
5. **Gemini 2.0 Flash** — Fast, cost-effective AI model from Google
6. **Web Speech API** — Native browser speech recognition & synthesis (no external libs)

---

## Project Structure

```
lisa-ai/
├── convex/                  # Convex backend
│   ├── ai.ts               # Gemini AI integration (chat action)
│   ├── schema.ts           # Database schema definition
│   ├── contacts.ts         # Contacts CRUD queries/mutations
│   ├── conversations.ts    # Conversation management
│   ├── messages.ts         # Message storage
│   ├── email.ts            # EmailJS email sending
│   ├── auth.ts             # Clerk authentication helpers
│   └── _generated/         # Auto-generated types (don't edit)
├── src/
│   ├── pages/              # Page components
│   │   ├── CallPage.jsx    # Main voice assistant interface ⭐
│   │   ├── ContactsPage.jsx # Contact management
│   │   ├── SettingsPage.jsx # User settings
│   │   ├── LandingPage.jsx # Public landing page
│   │   ├── SignInPage.jsx  # Login page
│   │   ├── SignUpPage.jsx  # Registration page
│   │   └── NotFoundPage.jsx # 404 page
│   ├── providers/          # Context providers
│   │   ├── AppProviders.jsx      # Main provider composition
│   │   ├── ClerkAuthProvider.jsx  # Clerk auth wrapper
│   │   └── ConvexClientProvider.jsx # Convex client wrapper
│   ├── constants/          # App constants
│   │   ├── routes.js       # Route definitions
│   │   └── theme.js        # Design tokens
│   ├── lib/                # Utilities
│   │   └── utils.js        # cn() helper for Tailwind
│   ├── App.jsx             # Route configuration
│   ├── main.jsx            # Entry point
│   └── index.css           # Global styles
├── public/                 # Static assets
│   └── favicon.svg
├── index.html              # HTML shell
├── package.json            # Dependencies
├── vite.config.js          # Vite configuration
├── tailwind.config.js      # Tailwind configuration
├── postcss.config.js       # PostCSS config
└── jsconfig.json           # Editor intellisense
```

---

## Database Schema

```typescript
// convex/schema.ts

tables:
  users          → Clerk sync (clerkId, email, name, plan)
  conversations  → Chat threads (userId, title, messageCount)
  messages       → Messages (conversationId, role, content)
  contacts       → Email contacts (userId, name, email)
  userSettings   → Preferences (voiceEnabled, autoSpeak)
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Clerk](https://clerk.com) account (free tier available)
- A [Convex](https://convex.dev) account (free tier available)
- Google Gemini API key from [AI Studio](https://aistudio.google.com)
- EmailJS account (optional, for email feature)

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd lisa-ai

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your keys
```

### Environment Variables

```env
# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...

# Convex Backend
CONVEX_DEPLOYMENT=your-deployment-url

# Google Gemini AI
GEMINI_API_KEY=AIza...

# EmailJS (optional)
EMAILJS_SERVICE_ID=...
EMAILJS_TEMPLATE_ID=...
EMAILJS_PUBLIC_KEY=...
```

### Development

```bash
# Start Vite dev server
npm run dev

# Start Convex backend (in another terminal)
npm run convex:dev
```

Visit `http://localhost:5173` to see the app.

### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

---

## Pages & Routes

| Route | Page | Auth Required | Description |
|-------|------|---------------|-------------|
| `/` | LandingPage | No | Marketing landing page |
| `/signin` | SignInPage | No | Login with Clerk |
| `/signup` | SignUpPage | No | Register with Clerk |
| `/call` | CallPage | ✅ Yes | **Main voice assistant** |
| `/contacts` | ContactsPage | ✅ Yes | Manage email contacts |
| `/settings` | SettingsPage | ✅ Yes | Voice toggle, clear history, logout |

---

## How It Works

### Always-Listening Mode

```
User starts call → Recognition starts (continuous=true)
                 ↓
User speaks → Interim results show live
                 ↓
Silence detected (1.5s) → Process text
                 ↓
Gemini generates response → Lisa speaks (TTS)
                 ↓
Speech ends → Auto-restart listening ← Loop continues
```

### Interruption Handling

When interim results are detected while Lisa is speaking:
1. Cancel `speechSynthesis` immediately
2. Clear speaking state
3. Continue capturing user's speech
4. Process new input after silence

### Guided Email Workflow

```
User: "Send email to Ali"
Lisa: "What should the email say?"

User: "Ask about the project deadline"
Lisa: "Ready to send to Ali. Subject: 'Project Deadline'. Should I send?"

User: "Yes"
Lisa: "Done! Email sent." ✅
```

---

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Set environment variables in Vercel dashboard
4. Deploy!

### Convex Cloud

Convex deploys automatically when you run:
```bash
npx convex deploy
```

---

## Troubleshooting

### "Speech recognition not supported"
→ Use Chrome or Edge browser (Web Speech API required)

### "Microphone permission denied"
→ Allow microphone access in browser settings

### Gemini API errors
→ Verify `GEMINI_API_KEY` is set correctly in Convex env vars:
```bash
npx convex env set GEMINI_API_KEY your-key
```

### Email not working
→ Configure EmailJS credentials or check console for errors

---

## License

MIT — Free for personal and commercial use.

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | July 2026 | Initial release — Always-listening mode, email workflow, contacts CRUD |

---

**Built with ❤️ using modern web technologies**
