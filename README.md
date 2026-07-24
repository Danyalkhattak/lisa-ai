# Lisa AI — Browser Voice Assistant

A voice-controlled AI assistant built for my university internship project.

**Tech Stack:** React · Vite · TailwindCSS · Clerk · Convex · Google Gemini

---

## Features

- **Always-Listening Mode** — No tap needed, just start talking
- **Voice Interruption** — Stop Lisa mid-sentence by talking over her
- **Female Voice** — Natural TTS with female voice selection
- **Email Workflow** — "Send email to Ali" → Lisa guides you step-by-step
- **Contacts CRUD** — Add, edit, delete email contacts
- **Authentication** — Secure login/signup with Clerk

---

## Quick Start

```bash
# Install
npm install

# Set environment variables (see .env.example)
cp .env.example .env.local

# Run dev server
npm run dev

# Run Convex backend (another terminal)
npm run convex:dev
```

**Visit:** `http://localhost:5173`

---

## Environment Variables

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
GEMINI_API_KEY=AIza...
```

Get keys from:
- [Clerk Dashboard](https://dashboard.clerk.com) → API Keys
- [Google AI Studio](https://aistudio.google.com) → Get API Key

---

## Project Structure

```
lisa-ai/
├── src/
│   ├── pages/
│   │   ├── CallPage.jsx       # Main voice assistant ⭐
│   │   ├── ContactsPage.jsx   # Contact management
│   │   ├── SettingsPage.jsx   # Settings & logout
│   │   ├── LandingPage.jsx    # Public landing page
│   │   ├── SignInPage.jsx     # Login
│   │   └── SignUpPage.jsx     # Register
│   ├── providers/             # Auth + DB providers
│   ├── constants/             # Routes, theme tokens
│   ├── App.jsx                # Router setup
│   └── main.jsx               # Entry point
├── convex/
│   ├── ai.ts                  # Gemini AI integration
│   ├── schema.ts              # Database schema
│   ├── contacts.ts            # Contact CRUD
│   ├── conversations.ts       # Chat threads
│   ├── messages.ts            # Message storage
│   └── email.ts               # EmailJS sender
└── public/
    └── favicon.svg
```

---

## Database Schema (Convex)

| Table | Fields | Purpose |
|-------|--------|---------|
| `users` | clerkId, email, name | Synced from Clerk |
| `conversations` | userId, title | Chat sessions |
| `messages` | conversationId, role, content | Chat history |
| `contacts` | userId, name, email | Email contacts |
| `userSettings` | voiceEnabled | User preferences |

---

## How It Works

### Always-Listening Flow

```
Start Call → Recognition ON (continuous)
    ↓
User speaks → Text captured in real-time
    ↓
1.5s silence → Process text → Call Gemini
    ↓
Lisa responds (TTS) → Auto-restart listening
    ↓
Loop continues until End Call
```

### Email Workflow Example

```
You:  "Send email to Ali"
Lisa: "What should it say?"

You:  "Ask about the project deadline"
Lisa: "Ready to send. Subject: 'Project Deadline'. Send?"

You:  "Yes"
Lisa: "Done! Email sent." ✅
```

---

## Tech Stack Details

| Technology | Version | Use Case |
|------------|---------|----------|
| React | 18.3+ | UI Components |
| Vite | 5.4+ | Build Tool |
| Tailwind CSS | 3.4+ | Styling |
| Framer Motion | 11.5+ | Animations |
| Clerk | 5.7+ | Authentication |
| Convex | 1.14+ | Backend/Database |
| Gemini 2.0 Flash | - | AI Model |
| Web Speech API | - | Speech Recognition & TTS |

---

## Pages & Routes

| Route | Page | Description |
|-------|------|-------------|
| `/` | Landing | Public landing page |
| `/signin` | Sign In | Login page |
| `/signup` | Sign Up | Registration |
| `/call` | **Call Page** | Main voice assistant |
| `/contacts` | Contacts | Manage contacts |
| `/settings` | Settings | Preferences |

---

## Build & Deploy

```bash
# Production build
npm run build

# Preview build
npm run preview
```

**Deploy to Vercel:**
1. Push to GitHub
2. Import in [Vercel](https://vercel.com)
3. Add env vars → Deploy

---

## What I Learned

- Web Speech API (SpeechRecognition + SpeechSynthesis)
- Real-time speech processing with silence detection
- Convex serverless backend architecture
- Google Gemini AI integration
- React state management with refs for async operations
- Authentication flow with Clerk
- Guided conversational UI patterns

---

## License

MIT — University Internship Project 2026

---

**Built by:** [Your Name]  
**Duration:** [Month Year] – [Month Year]  
**Supervisor:** [Supervisor Name]
