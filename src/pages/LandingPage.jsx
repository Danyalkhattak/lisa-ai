import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Phone, Sparkles, ArrowRight } from "lucide-react";

/**
 * LandingPage — Simplified minimal landing page.
 * 
 * Just:
 * - Lisa branding
 * - Brief tagline
 * - Login / Register buttons
 * - That's it
 */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#09090B] flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-cyan-500/8 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-500/5 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 flex flex-col items-center gap-8 px-6"
      >
        {/* Logo - Custom Favicon */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="relative"
        >
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-cyan-500 p-[3px]">
            <div className="w-full h-full rounded-full bg-[#09090B] flex items-center justify-center overflow-hidden">
              <img src="/favicon.png" alt="Lisa AI" className="w-20 h-20 object-cover" />
            </div>
          </div>
          
          {/* Glow effect */}
          <div className="absolute inset-0 -m-6 rounded-full bg-gradient-to-br from-purple-500/20 to-cyan-500/20 blur-xl -z-10" />
        </motion.div>

        {/* Title & Tagline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-center space-y-3"
        >
          <h1 className="text-5xl md:text-6xl font-bold text-white tracking-tight">
            Lisa
          </h1>
          <p className="text-lg md:text-xl text-gray-400 max-w-md">
            Your AI voice assistant. Just talk — no typing required.
          </p>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="flex flex-col sm:flex-row gap-4 pt-4"
        >
          <Link
            to="/sign-up"
            className="group flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300"
          >
            Get Started
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          
          <Link
            to="/sign-in"
            className="flex items-center gap-2 px-8 py-4 rounded-full border border-white/20 text-white font-semibold hover:bg-white/5 transition-all duration-300"
          >
            Sign In
          </Link>
        </motion.div>

        {/* Feature hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="flex items-center gap-6 pt-8 text-sm text-gray-500"
        >
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-cyan-400" />
            <span>Voice First</span>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>AI Powered</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-400">●</span>
            <span>Always Available</span>
          </div>
        </motion.div>
      </motion.div>

      {/* Bottom attribution */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="absolute bottom-8 text-xs text-gray-600"
      >
        Powered by Gemini AI
      </motion.div>
    </div>
  );
}
