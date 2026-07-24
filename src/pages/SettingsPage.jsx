import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser, useClerk } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import {
  Settings,
  Volume2,
  VolumeX,
  Trash2,
  LogOut,
  Check,
  AlertTriangle,
  User,
  Shield,
  Sparkles,
  ArrowLeft,
  ChevronRight,
} from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { cn } from "@/lib/utils";

/**
 * SettingsPage — Premium Settings UI
 * 
 * Design Philosophy:
 * - Clean card-based layout
 * - Clear visual hierarchy
 * - Professional interactions
 */

export default function SettingsPage() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const navigate = useNavigate();

  // State
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [cleared, setCleared] = useState(false);

  // Mutations
  const clearConversations = useMutation(api.conversations.clearAll);

  // Handle logout
  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  // Handle clear history
  const handleClearHistory = async () => {
    try {
      await clearConversations();
      setShowClearConfirm(false);
      setCleared(true);
      setTimeout(() => setCleared(false), 3000);
    } catch (err) {
      console.error("Failed to clear:", err);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090B]">
      {/* Header - Premium Style */}
      <header className="sticky top-0 z-20 bg-[#09090B]/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 sm:py-5 flex items-center gap-3">
          {/* Back button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/')}
            className="p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </motion.button>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/15 to-fuchsia-500/15 border border-violet-500/20 flex items-center justify-center">
              <Settings className="w-5 h-5 text-violet-400" />
            </div>
            <h1 className="text-lg sm:text-xl font-semibold text-white tracking-tight font-['Space_Grotesk',sans-serif]">Settings</h1>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        
        {/* Profile Card - Enhanced */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="p-5 sm:p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-sm">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl overflow-hidden bg-white/[0.05] border border-white/[0.08] flex items-center justify-center">
                {user?.imageUrl ? (
                  <img 
                    src={user.imageUrl} 
                    alt={user?.firstName} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-8 h-8 text-gray-400" />
                )}
              </div>
              
              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-lg truncate font-['Space_Grotesk',sans-serif]">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-gray-500 text-sm truncate mt-0.5">
                  {user?.emailAddresses?.[0]?.emailAddress}
                </p>
              </div>

              {/* Status badge */}
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs text-emerald-400 font-medium">Active</span>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Voice Settings - Enhanced */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-3"
        >
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-1 flex items-center gap-2">
            <Volume2 className="w-3.5 h-3.5" />
            Voice
          </h2>
          
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl divide-y divide-white/[0.04] backdrop-blur-sm overflow-hidden">
            <button
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300",
                  voiceEnabled 
                    ? "bg-violet-500/15 text-violet-400" 
                    : "bg-white/[0.04] text-gray-500"
                )}>
                  {voiceEnabled ? (
                    <Volume2 className="w-5 h-5" />
                  ) : (
                    <VolumeX className="w-5 h-5" />
                  )}
                </div>
                <div className="text-left">
                  <p className="text-white font-medium text-[15px]">Voice Responses</p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {voiceEnabled ? "Lisa speaks responses aloud" : "Text-only mode"}
                  </p>
                </div>
              </div>
              
              {/* Toggle Switch - Enhanced */}
              <div 
                onClick={(e) => { e.stopPropagation(); setVoiceEnabled(!voiceEnabled); }}
                className={cn(
                  "relative w-12 h-7 rounded-full cursor-pointer transition-all duration-300",
                  voiceEnabled 
                    ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 shadow-lg shadow-violet-500/25" 
                    : "bg-white/10"
                )}
              >
                <div className={cn(
                  "absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-300",
                  voiceEnabled ? "translate-x-6" : "translate-x-1"
                )} />
              </div>
            </button>
          </div>
        </motion.section>

        {/* Data Management - Enhanced */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-3"
        >
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-1 flex items-center gap-2">
            <Trash2 className="w-3.5 h-3.5" />
            Data
          </h2>
          
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl divide-y divide-white/[0.04] backdrop-blur-sm overflow-hidden">
            {!showClearConfirm ? (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="w-full flex items-center gap-3 p-4 hover:bg-red-500/5 transition-colors group"
              >
                <div className="w-10 h-10 rounded-xl bg-red-500/10 group-hover:bg-red-500/15 transition-colors flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-400" />
                </div>
                <div className="text-left flex-1">
                  <p className="text-white font-medium group-hover:text-red-400 transition-colors text-[15px]">
                    Clear Conversation History
                  </p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Permanently delete all conversations
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-red-400/50 transition-colors" />
              </button>
            ) : (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-4 space-y-4"
              >
                <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/8 border border-amber-500/15">
                  <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-400 text-sm">Are you sure?</p>
                    <p className="text-xs text-amber-400/70 mt-1">This action cannot be undone.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleClearHistory}
                    className="px-5 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-all shadow-lg shadow-red-500/20"
                  >
                    Yes, Clear All
                  </button>
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="px-5 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/10 text-white text-sm font-medium transition-all border border-white/[0.08]"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            )}

            {/* Success message */}
            <AnimatePresence>
              {cleared && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mx-4 mb-4 p-3.5 rounded-xl bg-emerald-500/8 border border-emerald-500/15 flex items-center gap-2.5 text-emerald-400 text-sm backdrop-blur-sm">
                    <Check className="w-4 h-4" />
                    Conversation history cleared successfully
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.section>

        {/* Account Actions - Enhanced */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-3"
        >
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-1 flex items-center gap-2">
            <User className="w-3.5 h-3.5" />
            Account
          </h2>
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 p-4 bg-white/[0.02] border border-white/[0.06] rounded-2xl hover:bg-red-500/5 hover:border-red-500/15 transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-red-500/10 group-hover:bg-red-500/15 transition-colors flex items-center justify-center">
              <LogOut className="w-5 h-5 text-red-400" />
            </div>
            <div className="flex-1 text-left">
              <span className="text-white font-medium group-hover:text-red-400 transition-colors text-[15px]">
                Sign Out
              </span>
              <p className="text-xs text-gray-500 mt-0.5">Sign out of your account</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-red-400/50 transition-colors" />
          </button>
        </motion.section>

        {/* App Info Card - Premium footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="pt-8 pb-4"
        >
          <div className="text-center space-y-4">
            {/* Logo */}
            <img src="/favicon.png" alt="Lisa AI" className="w-16 h-16 rounded-2xl object-cover" />
            
            <div className="space-y-1">
              <p className="text-white font-semibold font-['Space_Grotesk',sans-serif]">Lisa AI</p>
              <p className="text-xs text-gray-600">Version 1.0.0</p>
            </div>
            
            <div className="flex items-center justify-center gap-5 pt-2">
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <Sparkles className="w-3.5 h-3.5 text-violet-500/60" />
                <span>Powered by Gemini</span>
              </div>
              <div className="w-px h-3 bg-white/10" />
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <Shield className="w-3.5 h-3.5 text-emerald-500/60" />
                <span>Secured by Clerk</span>
              </div>
            </div>
            
            <p className="text-xs text-gray-700 pt-2">
              Made with care for better conversations
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
