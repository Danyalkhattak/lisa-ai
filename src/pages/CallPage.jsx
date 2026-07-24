import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Phone, 
  PhoneOff, 
  Volume2,
  Loader2,
  AlertCircle,
  Sparkles,
  User,
  Users,
  Settings,
  Mic,
  MicOff,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useAction } from "convex/react";
import { api } from "@convex/_generated/api";
import { useUser } from "@clerk/clerk-react";
import { cn } from "@/lib/utils";

/**
 * Lisa AI — Voice Assistant Interface
 * 
 * Features:
 * - Tap-to-Talk mode (press mic button to speak)
 * - AI-powered responses via Gemini
 * - Female voice TTS
 */

export default function CallPage() {
  const { user } = useUser();
  const navigate = useNavigate();
  
  // State
  const [isInCall, setIsInCall] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  
  // Transcript
  const [transcriptLines, setTranscriptLines] = useState([]);
  const [interimText, setInterimText] = useState('');
  const [currentSpokenText, setCurrentSpokenText] = useState('');
  
  // Refs
  const recognitionRef = useRef(null);
  const mountedRef = useRef(true);
  const conversationIdRef = useRef(null);
  
  // Convex
  const generateReply = useAction(api.ai.chat);
  const createConversation = useMutation(api.conversations.create);

  // ==================== Speech Recognition ====================
  
  const initRecognition = useCallback(() => {
    if (recognitionRef.current) return recognitionRef.current;
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Speech not supported. Use Chrome.');
      return null;
    }
    
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    
    recognition.onresult = (event) => {
      if (!mountedRef.current) return;
      
      let interim = '';
      let final = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }
      
      if (interim) {
        setInterimText(interim);
      }
      
      if (final) {
        setInterimText('');
        processAndSend(final);
      }
    };
    
    recognition.onerror = (event) => {
      console.error('[Lisa] Speech error:', event.error);
      if (!mountedRef.current) return;
      
      if (event.error === 'not-allowed') {
        setError('Microphone permission denied.');
      }
      
      setIsListening(false);
    };
    
    recognition.onend = () => {
      if (mountedRef.current) {
        setIsListening(false);
      }
    };
    
    recognitionRef.current = recognition;
    return recognition;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startListening = useCallback(() => {
    if (!mountedRef.current || isProcessing || isSpeaking) return;
    
    const recognition = initRecognition();
    if (!recognition) return;
    
    try {
      // Cancel any ongoing speech
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      
      recognition.abort();
      setTimeout(() => {
        if (mountedRef.current) {
          recognition.start();
          setIsListening(true);
          setInterimText('');
          setError(null);
        }
      }, 100);
    } catch (e) {
      console.error('[Lisa] Start error:', e);
      setIsListening(false);
    }
  }, [initRecognition, isProcessing, isSpeaking]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }
    setIsListening(false);
  }, []);

  // ==================== Core Processing ====================

  const processAndSend = useCallback(async (text) => {
    if (!text.trim() || !mountedRef.current) return;
    
    console.log('[Lisa] Processing:', text.trim());
    const cleanText = text.trim();
    setInterimText('');
    addLine('user', cleanText);
    
    setIsProcessing(true);
    
    try {
      // Create conversation if needed
      if (!conversationIdRef.current) {
        const convId = await createConversation({
          title: cleanText.slice(0, 50) + (cleanText.length > 50 ? '...' : ''),
        });
        conversationIdRef.current = convId;
      }

      // Get AI response - returns { content: string }
      const response = await generateReply({
        message: cleanText,
        conversationId: conversationIdRef.current,
      });

      if (!mountedRef.current) return;

      // Speak the response (extract content from object)
      const responseText = response?.content || response;
      if (responseText && typeof responseText === 'string' && responseText.trim()) {
        await speak(responseText);
      }
    } catch (err) {
      console.error('[Lisa] Error:', err);
      if (mountedRef.current) {
        setError(err.message || 'Something went wrong. Try again.');
        addLine('assistant', `Sorry, I encountered an error: ${err.message}`);
      }
    } finally {
      if (mountedRef.current) {
        setIsProcessing(false);
      }
    }
  }, [generateReply, createConversation]);

  // ==================== TTS ====================

  const speak = useCallback((text) => {
    return new Promise((resolve) => {
      if (!text?.trim() || !mountedRef.current) { resolve(); return; }

      const clean = text
        .replace(/```[\s\S]*?```/g, '')
        .replace(/`[^`]+`/g, '')
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/https?:\/\/[^\s]+/g, '')
        .trim();
      
      if (!clean) { resolve(); return; }

      setIsSpeaking(true);
      setCurrentSpokenText(clean);
      
      const utterance = new SpeechSynthesisUtterance(clean);
      
      // Female voice selection
      const voices = window.speechSynthesis.getVoices();
      const female = voices.find(v => 
        /^(Samantha|Victoria|Karen|Tessa|Zira|Google US English Female)/i.test(v.name)
      ) || voices.find(v => 
        v.lang?.startsWith('en') && /female|woman/i.test(v.name)
      );
      
      if (female) utterance.voice = female;
      utterance.rate = 0.95;
      utterance.pitch = 1.1;
      
      utterance.onend = () => {
        console.log('[Lisa] Speech ended');
        if (mountedRef.current) {
          setIsSpeaking(false);
          setCurrentSpokenText('');
          addLine('assistant', clean);
        }
        resolve();
      };
      
      utterance.onerror = (event) => {
        console.error('[Lisa] Speech error:', event?.error);
        if (mountedRef.current) {
          setIsSpeaking(false);
          setCurrentSpokenText('');
        }
        resolve();
      };
      
      window.speechSynthesis.speak(utterance);
    });
  }, []);

  // ==================== Transcript ====================

  const addLine = useCallback((role, text) => {
    setTranscriptLines(prev => [...prev.slice(-30), {
      role,
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
  }, []);

  // ==================== Call Control ====================

  const startCall = useCallback(() => {
    setIsInCall(true);
    setTranscriptLines([]);
    setError(null);
    conversationIdRef.current = null;
  }, []);

  const endCall = useCallback(() => {
    stopListening();
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    
    setIsInCall(false);
    setIsListening(false);
    setIsSpeaking(false);
    setIsProcessing(false);
    setInterimText('');
    setCurrentSpokenText('');
  }, [stopListening]);

  // Handle mic button press
  const handleMicPress = useCallback(() => {
    if (!isInCall) {
      startCall();
      return;
    }
    
    if (isListening) {
      stopListening();
    } else if (!isProcessing && !isSpeaking) {
      startListening();
    }
  }, [isInCall, isListening, isProcessing, isSpeaking, startCall, startListening, stopListening]);

  // ==================== Lifecycle ====================

  useEffect(() => {
    mountedRef.current = true;
    
    // Load voices
    if (window.speechSynthesis) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
    }
    
    return () => {
      mountedRef.current = false;
      endCall();
    };
  }, [endCall]);

  // ==================== Status Helpers ====================

  const getStatusConfig = () => {
    if (isProcessing) return { icon: Loader2, label: 'Thinking...', color: 'yellow', spin: true };
    if (isSpeaking) return { icon: Volume2, label: 'Speaking...', color: 'purple' };
    if (isListening) return { label: '🎤 Listening...', color: 'green' };
    return { label: isInCall ? 'Tap mic to speak' : 'Tap to start', color: 'gray' };
  };

  const status = getStatusConfig();

  // ==================== Render ====================

  return (
    <div className="h-screen w-full bg-[#09090B] flex flex-col overflow-hidden relative">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none hidden sm:block">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 sm:w-96 sm:h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 sm:w-96 sm:h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Header */}
      <header className="flex-shrink-0 flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 relative z-10">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Avatar with custom favicon */}
          <div className={cn(
            "w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all overflow-hidden",
            isInCall ? "bg-gradient-to-br from-green-400 to-emerald-500 animate-pulse" : "bg-gradient-to-br from-purple-500 to-cyan-500"
          )}>
            <img src="/favicon.png" alt="Lisa" className="w-full h-full object-cover" />
          </div>
          
          {/* Name + Status */}
          <div>
            <h1 className="text-white font-semibold text-base sm:text-lg">Lisa</h1>
            
            {/* Inline Status Indicator */}
            <div className={cn(
              "flex items-center gap-1.5 text-xs font-medium transition-colors",
              status.color === 'green' && "text-green-400",
              status.color === 'purple' && "text-purple-400",
              status.color === 'yellow' && "text-yellow-400",
              status.color === 'gray' && "text-gray-500"
            )}>
              {status.icon && (
                <status.icon className={cn("w-3 h-3", status.spin && "animate-spin")} />
              )}
              {status.label}
            </div>
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2">
          {/* Contacts button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { if (isInCall) endCall(); navigate('/contacts'); }}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-colors"
            title="Contacts"
          >
            <Users className="w-5 h-5 text-gray-400 hover:text-white transition-colors" />
          </motion.button>
          
          {/* Settings button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { if (isInCall) endCall(); navigate('/settings'); }}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-colors"
            title="Settings"
          >
            <Settings className="w-5 h-5 text-gray-400 hover:text-white transition-colors" />
          </motion.button>
          
          {/* Live badge - hidden on small screens */}
          {isInCall && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs text-green-400 font-medium">Ready</span>
            </motion.div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative z-10 px-4 sm:px-6 py-3 sm:py-4 overflow-hidden">
        
        {/* Transcript Area */}
        <div className="flex-1 max-w-2xl mx-auto w-full overflow-y-auto py-4 space-y-3 chat-scrollbar">
          <AnimatePresence initial={false}>
            {transcriptLines.map((line, idx) => (
              <motion.div key={`${idx}-${line.time}`}
                initial={{ opacity: 0, y: 10, x: line.role === 'user' ? 20 : -20 }}
                animate={{ opacity: 1, y: 0, x: 0 }}
                className={cn("flex", line.role === 'user' ? "justify-end" : "justify-start")}>
                <div className={cn(
                  "max-w-[90%] sm:max-w-[85%] px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed",
                  line.role === 'user'
                    ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-100 border border-cyan-500/30 rounded-br-md"
                    : "bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-100 border border-purple-500/30 rounded-bl-md"
                )}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs opacity-60">{line.role === 'user' ? 'You' : 'Lisa'}</span>
                    <span className="text-xs opacity-40">{line.time}</span>
                  </div>
                  <p>{line.text}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {/* Interim text (user speaking) */}
          {interimText && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              className="flex justify-end"
            >
              <div className="max-w-[90%] sm:max-w-[85%] px-4 py-2.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300/80 rounded-br-md text-sm">
                {interimText}
                <span className="inline-block w-1 h-4 bg-cyan-400 ml-1 animate-pulse" />
              </div>
            </motion.div>
          )}

          {/* Current spoken text (Lisa speaking) */}
          {currentSpokenText && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="max-w-[90%] sm:max-w-[85%] px-4 py-2.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-300/80 rounded-bl-md text-sm">
                {currentSpokenText}
                <span className="inline-block w-1 h-4 bg-purple-400 ml-1 animate-pulse" />
              </div>
            </motion.div>
          )}
        </div>

        {/* Error Display */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-2xl mx-auto w-full mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-2 text-red-400 text-sm"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Controls Area */}
        <div className="flex-shrink-0 pb-6 sm:pb-8">
          <div className="max-w-2xl mx-auto flex items-center justify-center gap-4">
            
            {/* End Call Button (only show when in call) */}
            {isInCall && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={endCall}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-lg shadow-red-500/25 transition-colors"
                title="End Call"
              >
                <PhoneOff className="w-6 h-6 text-white" />
              </motion.button>
            )}

            {/* Main Microphone Button - TAP TO TALK */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleMicPress}
              disabled={isProcessing || isSpeaking}
              className={cn(
                "w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center shadow-lg transition-all duration-200",
                isListening 
                  ? "bg-green-500 shadow-green-500/40 animate-pulse scale-110" 
                  : isInCall 
                    ? "bg-gradient-to-br from-purple-500 to-cyan-500 shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-105"
                    : "bg-gradient-to-br from-purple-500 to-pink-500 shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-105",
                (isProcessing || isSpeaking) && "opacity-50 cursor-not-allowed"
              )}
              title={isListening ? "Tap to stop" : isInCall ? "Tap to speak" : "Start Conversation"}
            >
              {isListening ? (
                <Mic className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              ) : (
                <MicOff className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              )}
            </motion.button>

            {/* Spacer for balance */}
            {!isInCall && <div className="w-14 h-14 sm:w-16 sm:h-16" />}
          </div>
          
          {/* Instruction Text */}
          <p className="text-center mt-4 text-gray-500 text-xs sm:text-sm">
            {isInCall 
              ? isListening 
                ? "🎤 Listening... Tap mic to stop" 
                : "Tap the microphone to speak"
              : "Tap the microphone to start"
            }
          </p>
        </div>
      </main>
    </div>
  );
}
