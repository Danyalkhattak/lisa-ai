import { useState } from "react";
import { motion } from "framer-motion";
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
} from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { cn } from "@/lib/utils";

/**
 * Settings Page - Minimal settings for Lisa AI.
 * 
 * Features:
 * - Enable/Disable voice responses
 * - Clear conversation history
 * - Logout
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
      {/* Header */}
      <header className="border-b border-white/10 bg-[#09090B]/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <h1 className="text-xl font-semibold text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-purple-400" />
            Settings
          </h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* User Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10"
        >
          <img
            src={user?.imageUrl || `https://ui-avatars.com/api/?name=${user?.firstName || 'U'}&background=7c3aed&color=fff`}
            alt={user?.firstName}
            className="w-14 h-14 rounded-full"
          />
          <div>
            <p className="text-white font-medium text-lg">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-gray-500 text-sm">{user?.emailAddresses?.[0]?.emailAddress}</p>
          </div>
        </motion.div>

        {/* Voice Settings */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-2"
        >
          <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Voice</h2>
          
          <div className="bg-white/5 border border-white/10 rounded-xl divide-y divide-white/10">
            <button
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                {voiceEnabled ? (
                  <Volume2 className="w-5 h-5 text-purple-400" />
                ) : (
                  <VolumeX className="w-5 h-5 text-gray-500" />
                )}
                <span className="text-white">Voice Responses</span>
              </div>
              <div className={cn(
                "w-12 h-7 rounded-full transition-colors relative",
                voiceEnabled ? "bg-purple-500" : "bg-gray-600"
              )}>
                <div className={cn(
                  "absolute top-1 w-5 h-5 rounded-full bg-white transition-transform",
                  voiceEnabled ? "translate-x-6" : "translate-x-1"
                )} />
              </div>
            </button>

            <p className="px-4 pb-4 text-sm text-gray-500">
              {voiceEnabled 
                ? "Lisa will speak her responses aloud." 
                : "Responses will be shown as text only."}
            </p>
          </div>
        </motion.section>

        {/* Data Management */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-2"
        >
          <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Data</h2>
          
          <div className="bg-white/5 border border-white/10 rounded-xl divide-y divide-white/10">
            {!showClearConfirm ? (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="w-full flex items-center justify-between p-4 hover:bg-red-500/10 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <Trash2 className="w-5 h-5 text-red-400" />
                  <span className="text-white group-hover:text-red-400 transition-colors">
                    Clear Conversation History
                  </span>
                </div>
              </button>
            ) : (
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-3 text-yellow-400">
                  <AlertTriangle className="w-5 h-5" />
                  <span>Are you sure? This cannot be undone.</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleClearHistory}
                    className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors"
                  >
                    Yes, Clear All
                  </button>
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {cleared && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mx-4 mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                Conversation history cleared!
              </motion.div>
            )}
          </div>
        </motion.section>

        {/* Account */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-2"
        >
          <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Account</h2>
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-red-500/10 transition-colors group"
          >
            <LogOut className="w-5 h-5 text-red-400" />
            <span className="text-white group-hover:text-red-400 transition-colors">
              Sign Out
            </span>
          </button>
        </motion.section>

        {/* App Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="pt-8 text-center text-xs text-gray-600 space-y-1"
        >
          <p>Lisa AI v1.0.0</p>
          <p>Your friendly voice assistant</p>
        </motion.div>
      </main>
    </div>
  );
}
