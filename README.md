# Lisa AI — Browser Voice Assistant

A voice-controlled AI assistant built for my university internship project.

**Tech Stack:** React · Vite · TailwindCSS · Clerk · Convex · Google Gemini

---

## Features

- **Tap-to-Talk Mode** — Press the mic button to speak, release when done
- **Voice Responses** — Lisa speaks back with natural female TTS
- **Email Workflow** — "Send email to Ali" → Lisa guides you step-by-step (**REAL emails via Resend**)
- **Contacts CRUD** — Add, edit, delete email contacts
- **Authentication** — Secure login/signup with Clerk
- **Responsive Design** — Works on mobile and desktop

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
# Required - Authentication & AI
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
GEMINI_API_KEY=AIza...

# Required - For REAL email sending (FREE tier: 3000 emails/month)
RESEND_API_KEY=re_your_key_here
EMAIL_FROM=Lisa AI <onboarding@resend.dev>
```

Get keys from:
- [Clerk Dashboard](https://dashboard.clerk.com) → API Keys
- [Google AI Studio](https://aistudio.google.com) → Get API Key
- [Resend Dashboard](https://resend.com) → API Keys (FREE)

### Setting Up Email (Required for Email Feature)

1. **Sign up for Resend** (free): https://resend.com/signup
2. **Get API Key**: Dashboard → API Keys → Create API Key
3. **Add to Convex env**: 
   ```bash
   npx convex env set RESEND_API_KEY re_your_key_here
   npx convex env set EMAIL_FROM "Lisa AI <onboarding@resend.dev>"
   ```
4. **Test it**: Use Lisa's voice command "Send email to [contact]"

---

## How It Works

### Tap-to-Talk Flow

```
1. Tap microphone button → Start conversation
2. Tap mic again → Start listening
3. Speak your message
4. Lisa processes & responds (voice + text)
5. Tap mic again for next message
6. Press End Call when done
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
│   ├── App.jsx                # Router setup
│   └── main.jsx               # Entry point
├── convex/
│   ├── ai.ts                  # Gemini AI integration
│   ├── schema.ts              # Database schema
│   ├── contacts.ts            # Contact CRUD
│   └── email.ts               # Email sender
└── public/
    └── favicon.svg
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
| Resend API | - | Real Email Sending |
| Web Speech API | - | Speech Recognition & TTS |

---

## Pages & Routes

| Route | Page | Description |
|-------|------|-------------|
| `/` | Landing | Public landing page |
| `/signin` | Sign In | Login page |
| `/signup` | Sign Up | Registration |
| `/call` | **Call Page** | Main voice assistant (tap-to-talk) |
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
- Push-to-talk voice interaction patterns
- Convex serverless backend architecture
- Google Gemini AI integration
- React state management with refs for async operations
- Authentication flow with Clerk
- Guided conversational UI patterns
- Responsive mobile-first design

---

## License

MIT — University Internship Project 2026

---

**Built by:** [Your Name]  
**Duration:** [Month Year] – [Month Year]  
**Supervisor:** [Supervisor Name]
