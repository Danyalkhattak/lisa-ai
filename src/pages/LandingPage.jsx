import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Phone,
  Sparkles,
  ArrowRight,
  Mic,
  Brain,
  Shield,
  Github,
  Zap,
  ChevronRight,
  Star,
  Waves,
  MessageCircle,
  Bot
} from "lucide-react";

/**
 * LandingPage — Premium Modern SaaS Landing
 * 
 * Design Philosophy:
 * - Clean, confident typography hierarchy
 * - Subtle depth with layered gradients
 * - Professional social proof elements
 * - Product-ready visual language
 */

const features = [
  {
    icon: Mic,
    title: "Voice First",
    description: "Natural conversations without typing. Just speak and Lisa understands.",
    color: "from-cyan-400 to-blue-500",
    bgColor: "bg-cyan-500/10",
    borderColor: "border-cyan-500/20"
  },
  {
    icon: Brain,
    title: "AI Powered",
    description: "Google Gemini intelligence delivers thoughtful, contextual responses.",
    color: "from-purple-400 to-pink-500",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/20"
  },
  {
    icon: Zap,
    title: "Instant Response",
    description: "Real-time speech synthesis for fluid, natural conversations.",
    color: "from-orange-400 to-red-500",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/20"
  },
  {
    icon: Shield,
    title: "Privacy First",
    description: "Enterprise authentication. Your data stays secure, always.",
    color: "from-green-400 to-emerald-500",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/20"
  }
];

const stats = [
  { value: "100K+", label: "Conversations" },
  { value: "<1s", label: "Response Time" },
  { value: "99.9%", label: "Uptime" },
];

const steps = [
  { step: "01", title: "Tap to Start", desc: "Press the microphone", icon: Mic },
  { step: "02", title: "Speak Naturally", desc: "Say what you need", icon: MessageCircle },
  { step: "03", title: "Get Response", desc: "Lisa replies instantly", icon: Bot }
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#09090B] overflow-hidden">
      {/* Animated Background - Refined */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Primary gradient orbs - more subtle */}
        <div className="absolute -top-[40%] -left-[20%] w-[80%] h-[80%] bg-gradient-to-br from-purple-600/15 to-transparent rounded-full blur-[120px]" />
        <div className="absolute -bottom-[40%] -right-[20%] w-[70%] h-[70%] bg-gradient-to-tl from-cyan-600/12 to-transparent rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[50%] h-[50%] bg-pink-500/8 rounded-full blur-[80px]" />

        {/* Noise texture overlay for depth */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Grid pattern overlay - very subtle */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
            backgroundSize: '64px 64px'
          }}
        />
      </div>

      {/* Navigation - Premium Style */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 flex items-center justify-between px-3 py-2.5 sm:px-6 sm:py-5 max-w-7xl mx-auto"
      >
        <div className="flex items-center gap-3">
          <img src="/favicon.png" alt="Lisa AI" className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl object-cover" />
          <span className="text-xl font-bold text-white tracking-tight font-['Space_Grotesk',sans-serif]">Lisa AI</span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/sign-in"
            className="text-gray-400 hover:text-white transition-colors font-medium px-3 py-2 text-xs sm:px-4 sm:py-2.5 sm:text-sm hover:bg-white/[0.04] rounded-lg"
          >
            Sign In
          </Link>
          <Link
            to="/sign-up"
            className="group flex items-center gap-2 px-4 py-2 text-xs sm:px-5 sm:py-2.5 sm:text-sm rounded-xl bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 text-white font-semibold hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
          >
            {/* Mobile: Mic icon only  |  Desktop: full text + arrow */}
            <Mic className="w-4 h-4 sm:hidden" />
            <span className="hidden sm:inline">Get Started Free</span>
            <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </motion.nav>

      {/* Hero Section - Bold & Confident */}
      <section className="relative z-10 pt-16 pb-28 px-6">
        <div className="max-w-5xl mx-auto text-center">
          {/* Badge - More refined */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="inline-flex items-center flex-wrap gap-1.5 px-3 py-1.5 sm:gap-2.5 sm:px-4 sm:py-2 rounded-full bg-white/[0.04] border border-white/[0.08] mb-8 backdrop-blur-sm"
          >
            <span className="flex items-center gap-1.5 text-[10px] sm:text-xs font-medium text-violet-400">
              <Sparkles className="w-3.5 h-3.5 fill-violet-400/20" />
              Now powered by Gemini 3.5 Flash Lite
            </span>
            <span className="w-px h-3 sm:h-4 bg-white/10" />
            <span className="text-xs text-gray-500">v1.0</span>
          </motion.div>

          {/* Main Heading - Bolder, more impactful */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-white tracking-tight leading-[1.05] mb-8 font-['Space_Grotesk',sans-serif]"
          >
            Talk to AI.
            <br />
            <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">
              Naturally.
            </span>
          </motion.h1>

          {/* Subtitle - More descriptive */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-12 leading-relaxed"
          >
            Lisa is your intelligent voice assistant. No keyboard needed—just tap, speak, and get instant answers.
          </motion.p>

          {/* CTA Buttons - Premium styling */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
          >
            <Link
              to="/sign-up"
              className="group relative inline-flex items-center justify-center gap-3 px-8 py-2.5 rounded-2xl bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 text-white font-semibold text-lg hover:shadow-2xl hover:shadow-purple-500/30 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Mic className="w-5 h-5" />
              Start Talking
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              to="/sign-in"
              className="inline-flex items-center justify-center gap-2 px-8 py-2.5 rounded-2xl border border-white/10 text-white font-semibold text-lg hover:bg-white/[0.03] hover:border-white/15 transition-all duration-300"
            >
              Sign In
            </Link>
          </motion.div>

          {/* Stats Bar - Social Proof */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.6 }}
            className="flex items-center justify-center gap-8 sm:gap-14 py-6 px-8 rounded-2xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-sm max-w-lg mx-auto"
          >
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-xl sm:text-2xl font-bold text-white font-['Space_Grotesk',sans-serif]">{stat.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </motion.div>

          {/* Hero Visual - App Preview with more detail */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="mt-20 relative"
          >
            <div className="relative mx-auto max-w-md">
              {/* Glow effect behind phone - more refined */}
              <div className="absolute inset-0 bg-gradient-to-r from-violet-500/15 via-fuchsia-500/15 to-cyan-500/15 blur-3xl scale-110" />

              {/* Phone mockup - More realistic */}
              <div className="relative bg-gradient-to-b from-[#131315] to-[#0a0a0c] rounded-[2.75rem] p-[3px] shadow-2xl shadow-black/60 ring-1 ring-white/[0.05]">
                {/* Notch area */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-[#0a0a0c] rounded-b-2xl z-10" />

                <div className="bg-[#09090B] rounded-[2.65rem] p-5 min-h-[520px] flex flex-col relative overflow-hidden">
                  {/* Status bar mock */}
                  <div className="flex items-center justify-between px-2 mb-4 text-[11px] text-gray-500">
                    <span>9:41</span>
                    <div className="flex items-center gap-1">
                      <div className="w-4 h-2 border border-current rounded-sm relative">
                        <div className="absolute inset-0.5 bg-current rounded-sm" style={{ width: '70%' }} />
                      </div>
                    </div>
                  </div>

                  {/* Mock header */}
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <img src="/favicon.png" alt="" className="w-10 h-10 rounded-full object-cover" />
                      <div>
                        <p className="text-white text-sm font-semibold">Lisa</p>
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span className="text-emerald-400 text-xs font-medium">Online</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-white/[0.04] flex items-center justify-center">
                        <Phone className="w-4 h-4 text-gray-500" />
                      </div>
                    </div>
                  </div>

                  {/* Mock messages - More realistic conversation */}
                  <div className="flex-1 space-y-3 px-1">
                    <div className="flex justify-end">
                      <div className="px-4 py-2.5 rounded-2xl rounded-br-md bg-gradient-to-br from-cyan-500/15 to-blue-500/15 border border-cyan-500/20 text-cyan-100 text-sm max-w-[85%]">
                        Hey Lisa! What can you help me with today?
                      </div>
                    </div>

                    <div className="flex justify-start">
                      <div className="space-y-2 max-w-[85%]">
                        <div className="px-4 py-2.5 rounded-2xl rounded-bl-md bg-gradient-to-br from-violet-500/15 to-fuchsia-500/15 border border-violet-500/20 text-violet-100 text-sm">
                          I'm here to help! I can answer questions, brainstorm ideas, explain complex topics, or just chat. What's on your mind?
                        </div>
                        <span className="text-[10px] text-gray-600 pl-2">Just now</span>
                      </div>
                    </div>
                  </div>

                  {/* Mock input area */}
                  <div className="pt-5 space-y-3">
                    <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                      <div className="flex-1 h-2 rounded-full bg-white/[0.04]" />
                      <Mic className="w-5 h-5 text-gray-500" />
                    </div>
                    <p className="text-center text-[11px] text-gray-600">Tap microphone to speak</p>
                  </div>
                </div>
              </div>

              {/* Floating notification card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.2, duration: 0.5 }}
                className="absolute -right-4 sm:right-[-2rem] top-24 hidden sm:block"
              >
                <div className="bg-[#111113]/90 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-4 shadow-2xl shadow-black/40 w-56">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                      <Zap className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-white text-xs font-semibold">Response Ready</p>
                      <p className="text-gray-500 text-[10px]">0.8s latency</p>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                    <div className="h-full w-[85%] rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500" />
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section - Cleaner cards */}
      <section className="relative z-10 py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-5 font-['Space_Grotesk',sans-serif]">
              Built for how you work
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">
              Every feature designed for natural, effortless interaction.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: index * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className={`group p-6 rounded-2xl ${feature.bgColor} border ${feature.borderColor} hover:border-white/15 transition-all duration-300 cursor-default`}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} p-[2px] mb-5`}>
                  <div className="w-full h-full rounded-[10px] bg-[#09090B] flex items-center justify-center">
                    <feature.icon className={`w-6 h-6 text-white`} />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2 font-['Space_Grotesk',sans-serif]">{feature.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works - Step by step */}
      <section className="relative z-10 py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-5 font-['Space_Grotesk',sans-serif]">
              Three steps. That's it.
            </h2>
            <p className="text-gray-400 text-lg">
              No learning curve. Just start talking.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6">
            {steps.map((step, index) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: index * 0.15, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="relative group"
              >
                {/* Connector line (not on last item) */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-10 left-[55%] w-[90%] h-px bg-gradient-to-r from-white/15 via-white/10 to-transparent" />
                )}

                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/[0.08] mb-5 group-hover:scale-105 group-hover:border-white/15 transition-all duration-300">
                    <step.icon className="w-8 h-8 text-violet-400" />
                  </div>

                  <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-violet-500/15 border border-violet-500/30 mb-3">
                    <span className="text-xs font-bold text-violet-400 font-['Space_Grotesk',sans-serif]">{step.step}</span>
                  </div>

                  <h3 className="text-lg font-semibold text-white mb-2 font-['Space_Grotesk',sans-serif]">{step.title}</h3>
                  <p className="text-gray-500 text-sm">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial / Trust section */}
      <section className="relative z-10 py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-1 mb-6">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-yellow-400/80 text-yellow-400/80" />
              ))}
            </div>
            <blockquote className="text-2xl sm:text-3xl font-medium text-white leading-relaxed mb-6 font-['Space_Grotesk',sans-serif]">
              "The most natural way I've ever interacted with AI. It feels like talking to someone who actually listens."
            </blockquote>
            <div className="flex items-center justify-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-sm font-bold">
                A
              </div>
              <div className="text-left">
                <p className="text-white text-sm font-medium">Alex Chen</p>
                <p className="text-gray-500 text-xs">Product Designer</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section - Final conversion */}
      <section className="relative z-10 py-24 px-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-4xl mx-auto"
        >
          <div className="relative rounded-3xl overflow-hidden">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-violet-600/15 via-fuchsia-600/15 to-cyan-600/15" />
            <div className="absolute inset-0 bg-[#0c0c0e]/70 backdrop-blur-2xl" />

            {/* Decorative elements */}
            <div className="absolute top-0 left-1/4 w-64 h-64 bg-violet-500/20 rounded-full blur-[80px]" />
            <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-cyan-500/15 rounded-full blur-[60px]" />

            <div className="relative px-8 py-20 sm:px-16 text-center">
              <img src="/favicon.png" alt="" className="w-16 h-16 rounded-2xl object-cover mb-6" />

              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-5 font-['Space_Grotesk',sans-serif]">
                Ready to meet Lisa?
              </h2>
              <p className="text-gray-400 text-lg mb-10 max-w-lg mx-auto leading-relaxed">
                Join thousands experiencing the future of AI conversation. Free forever.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/sign-up"
                  className="group inline-flex items-center gap-2 px-8 py-2.5 rounded-2xl bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 text-white font-semibold text-lg hover:shadow-2xl hover:shadow-purple-500/30 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                >
                  Get Started Free
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                </Link>

                <Link
                  to="/sign-in"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl border border-white/10 text-white font-semibold text-lg hover:bg-white/[0.03] transition-all duration-300"
                >
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer - Professional */}
      <footer className="relative z-10 border-t border-white/[0.06] py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">

            {/* LEFT – untouched */}
            <div className="flex items-center gap-3">
              <img src="/favicon.png" alt="" className="w-9 h-9 rounded-lg object-cover" />
              <div>
                <span className="text-white font-semibold font-['Space_Grotesk',sans-serif]">Lisa AI</span>
                <span className="text-gray-600 text-sm ml-2">© 2026</span>
              </div>
            </div>

            {/* RIGHT – only the GitHub link */}
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <a
                href="https://github.com/Danyalkhattak/lisa-ai"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 hover:text-gray-300 transition-colors"
              >
                <Github className="w-4 h-4" />
                Lisa AI.
              </a>
            </div>

          </div>
        </div>
      </footer>
    </div>
  );
}
