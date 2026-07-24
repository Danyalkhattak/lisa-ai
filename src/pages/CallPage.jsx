import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Phone, 
  PhoneOff, 
  Volume2,
  Loader2,
  AlertCircle,
  Sparkles,
  Mail,
  User,
  Settings,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useAction, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useUser } from "@clerk/clerk-react";
import { cn } from "@/lib/utils";

/**
 * Lisa AI — Voice Assistant Interface
 * 
 * Features:
 * - Always-listening mode (no tap needed)
 * - Interruption handling (stop speaking when user talks)
 * - Guided email workflow (Siri-like)
 * - Female voice TTS
 */

// Email workflow states
const EMAIL = {
  IDLE: 'idle',
  ASKING_WHO: 'asking_who',
  ASKING_WHAT: 'asking_what', 
  CONFIRMING: 'confirming',
  SENDING: 'sending',
};

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
  
  // Email workflow
  const [emailState, setEmailState] = useState(EMAIL.IDLE);
  const [emailContact, setEmailContact] = useState(null);
  const [emailDraft, setEmailDraft] = useState(null);
  
  // Refs
  const recognitionRef = useRef(null);
  const processingRef = useRef(false);
  const mountedRef = useRef(true);
  const silenceTimerRef = useRef(null);
  const finalTranscriptRef = useRef('');
  const restartTimerRef = useRef(null);
  const conversationIdRef = useRef(null);
  
  // Convex
  const generateReply = useAction(api.ai.chat);
  const createConversation = useMutation(api.conversations.create);
  const sendEmailMutation = useMutation(api.email.send);

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
    recognition.continuous = true;
    recognition.interimResults = true;
    
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
        // Handle interruption
        if (isSpeaking && window.speechSynthesis) {
          window.speechSynthesis.cancel();
          setIsSpeaking(false);
          setCurrentSpokenText('');
        }
        resetSilenceTimer();
      }
      
      if (final) {
        finalTranscriptRef.current += final;
        resetSilenceTimer();
      }
    };
    
    recognition.onerror = (event) => {
      if (!mountedRef.current) return;
      if (event.error === 'not-allowed') {
        setError('Microphone permission denied.');
      } else if (isInCall) {
        setTimeout(() => startListening(), 500);
      }
    };
    
    recognition.onend = () => {
      if (!mountedRef.current) return;
      setIsListening(false);
      
      // Process any remaining text
      if (finalTranscriptRef.current.trim() && !processingRef.current) {
        processAndSend(finalTranscriptRef.current);
        finalTranscriptRef.current = '';
      }
      
      // Auto-restart if still in call
      if (isInCall && !processingRef.current) {
        restartTimerRef.current = setTimeout(() => {
          if (mountedRef.current && isInCall) startListening();
        }, 200);
      }
    };
    
    recognition.onstart = () => {
      if (mountedRef.current) {
        setIsListening(true);
        setError(null);
      }
    };
    
    recognitionRef.current = recognition;
    return recognition;
  }, [isSpeaking, isInCall]);

  const resetSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    
    silenceTimerRef.current = setTimeout(() => {
      if (finalTranscriptRef.current.trim() && !processingRef.current && mountedRef.current) {
        const text = finalTranscriptRef.current.trim();
        finalTranscriptRef.current = '';
        processAndSend(text);
      }
    }, 1500);
  }, []);

  const startListening = useCallback(() => {
    if (!mountedRef.current) return;
    const recognition = initRecognition();
    if (!recognition) return;
    
    try {
      recognition.abort();
      setTimeout(() => {
        if (mountedRef.current) recognition.start();
      }, 100);
    } catch (e) {
      console.error('[Lisa] Start error:', e);
    }
  }, [initRecognition]);

  const stopListening = useCallback(() => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
    if (recognitionRef.current) try { recognitionRef.current.stop(); } catch (e) {}
    setIsListening(false);
  }, []);

  // ==================== Email Detection ====================
  
  function isEmailIntent(text) {
    const lower = text.toLowerCase();
    return lower.includes('send') && (lower.includes('email') || lower.includes('mail'));
  }

  function extractName(text) {
    const patterns = [
      /send\s+(?:an?\s+)?(?:email|mail)\s+to\s+(.+?)(?:\s*(?:and|about|$))/i,
      /email\s+(?:to|for)\s+(.+?)$/i,
    ];
    for (const p of patterns) {
      const m = text.match(p);
      if (m?.[1]) return m[1].trim().replace(/[.!?,]$/, '');
    }
    return null;
  }

  // ==================== Core Processing ====================

  const processAndSend = useCallback(async (text) => {
    if (!text.trim() || processingRef.current || !mountedRef.current) return;
    
    stopListening();
    setInterimText('');
    addLine('user', text.trim());
    
    processingRef.current = true;
    setIsProcessing(true);
    
    try {
      // Cancel check
      if (text.toLowerCase().includes('cancel')) {
        resetEmail();
        await speak("Okay, cancelled.");
        return;
      }

      // Yes/No during email confirmation
      const lower = text.toLowerCase().trim();
      if ((lower.startsWith('yes') || lower.startsWith('sure') || lower.startsWith('ok')) 
          && emailState === EMAIL.CONFIRMING && emailDraft) {
        await doSendEmail();
        return;
      }

      if ((lower.startsWith('no') || lower.includes("don't"))
          && (emailState === EMAIL.CONFIRMING || emailState === EMAIL.ASKING_WHO)) {
        resetEmail();
        await speak("No problem! Anything else?");
        return;
      }

      // Email workflow states
      if (emailState === EMAIL.ASKING_WHO) {
        await handleRecipient(text.trim());
        return;
      }

      if (emailState === EMAIL.ASKING_WHAT) {
        await generateDraft(text.trim());
        return;
      }

      // Check email intent
      if (isEmailIntent(text)) {
        const name = extractName(text);
        if (name) {
          addLine('assistant', `Looking up ${name}...`);
          await handleRecipient(name);
        } else {
          setEmailState(EMAIL.ASKING_WHO);
          await speak("Who would you like to email?");
        }
        return;
      }

      // Normal chat
      await handleChat(text);
      
    } catch (err) {
      console.error('[Lisa] Error:', err);
      if (mountedRef.current) {
        addLine('assistant', 'Sorry, something went wrong. Could you repeat?');
      }
    } finally {
      processingRef.current = false;
      if (mountedRef.current) {
        setIsProcessing(false);
        // Always restart listening after response
        if (isInCall) {
          setTimeout(() => {
            if (mountedRef.current && isInCall && !processingRef.current) {
              startListening();
            }
          }, 300);
        }
      }
    }
  }, [emailState, emailDraft, isInCall, stopListening, startListening]);

  // ==================== Email Handlers ====================

  async function handleRecipient(name) {
    try {
      const contactsResult = await searchContacts(name).catch(() => []);
      const contacts = Array.isArray(contactsResult) ? contactsResult : [];
      
      const match = contacts.find(c => 
        c.name.toLowerCase() === name.toLowerCase() ||
        c.name.toLowerCase().includes(name.toLowerCase())
      );
      
      if (match) {
        setEmailContact(match);
        setEmailState(EMAIL.ASKING_WHAT);
        addLine('assistant', `Found ${match.name}.`);
        await speak(`I found ${match.name}. What should the email say?`);
      } else {
        resetEmail();
        await speak(`I couldn't find ${name} in your contacts. Add them on the Contacts page first.`);
      }
    } catch (err) {
      console.error('[Lisa] Contact search error:', err);
      resetEmail();
      await speak("Trouble searching contacts. Try again.");
    }
  }

  async function searchContacts(query) {
    // This will use Convex query
    const response = await fetch('/api/contacts/search?q=' + encodeURIComponent(query));
    return response.json();
  }

  async function generateDraft(content) {
    setEmailState(EMAIL.SENDING); // Show processing state
    
    try {
      let convId = conversationIdRef.current;
      if (!convId) {
        convId = await createConversation({ title: 'Voice Call' });
        conversationIdRef.current = convId;
      }

      const result = await generateReply({
        conversationId: convId,
        message: `Generate a professional email: "${content}". To: ${emailContact.name}. Return as:\nSubject: ...\n\n[body]`,
      });
      
      if (result?.content) {
        let subject = '', body = result.content;
        const subjMatch = result.content.match(/Subject:\s*(.+?)(?:\n\n|\n)/i);
        if (subjMatch) {
          subject = subjMatch[1].trim();
          body = result.content.replace(/Subject:\s*.+?(?:\n\n|\n)/i, '').trim();
        } else {
          subject = `Message from ${user?.firstName || 'Me'}`;
        }
        
        const draft = { subject, body, to: emailContact.email };
        setEmailDraft(draft);
        setEmailState(EMAIL.CONFIRMING);
        
        addLine('assistant', `Email ready for ${emailContact.name}.\nSubject: ${subject}\n${body.substring(0, 150)}...`);
        await speak(`Ready to send to ${emailContact.name}. Subject: "${subject}". Should I send?`);
      }
    } catch (err) {
      console.error('[Lisa] Draft error:', err);
      resetEmail();
      await speak("Trouble generating email. Try again.");
    }
  }

  async function doSendEmail() {
    if (!emailDraft) return;
    
    try {
      await sendEmailMutation({
        to: emailDraft.to,
        subject: emailDraft.subject,
        body: emailDraft.body,
      });
      
      addLine('assistant', `✅ Email sent to ${emailContact.name}!`);
      await speak(`Done! Email sent to ${emailContact.name}.`);
      resetEmail();
    } catch (err) {
      console.error('[Lisa] Send error:', err);
      resetEmail();
      await speak("Couldn't send email. Check settings.");
    }
  }

  function resetEmail() {
    setEmailState(EMAIL.IDLE);
    setEmailContact(null);
    setEmailDraft(null);
  }

  // ==================== Chat Handler ====================

  async function handleChat(text) {
    let convId = conversationIdRef.current;
    if (!convId) {
      convId = await createConversation({ title: 'Voice Call' });
      if (!mountedRef.current) return;
      conversationIdRef.current = convId;
    }
    
    const result = await generateReply({
      conversationId: convId,
      message: text.trim(),
    });
    
    if (!mountedRef.current) return;
    
    if (result?.content) {
      await speak(result.content);
    }
  }

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
        if (mountedRef.current) {
          setIsSpeaking(false);
          setCurrentSpokenText('');
          addLine('assistant', clean);
        }
        resolve();
      };
      
      utterance.onerror = () => {
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
    finalTranscriptRef.current = '';
    resetEmail();
    
    setTimeout(() => {
      if (mountedRef.current) startListening();
    }, 500);
  }, [startListening]);

  const endCall = useCallback(() => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
    if (recognitionRef.current) try { recognitionRef.current.abort(); } catch (e) {}
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    
    setIsInCall(false);
    setIsListening(false);
    setIsSpeaking(false);
    setIsProcessing(false);
    setInterimText('');
    setCurrentSpokenText('');
    finalTranscriptRef.current = '';
    processingRef.current = false;
    resetEmail();
  }, []);

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
    if (emailState === EMAIL.ASKING_WHO) return { icon: User, label: 'Who to email?', color: 'blue' };
    if (emailState === EMAIL.ASKING_WHAT) return { icon: Mail, label: 'What to say?', color: 'blue' };
    if (emailState === EMAIL.CONFIRMING) return { label: 'Confirm?', color: 'blue' };
    if (emailState === EMAIL.SENDING) return { icon: Loader2, label: 'Sending...', color: 'blue', spin: true };
    return { label: isInCall ? 'Ready' : 'Tap to start', color: 'gray' };
  };

  const status = getStatusConfig();

  // ==================== Render ====================

  return (
    <div className="h-screen w-full bg-[#09090B] flex flex-col overflow-hidden relative">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Header */}
      <header className="flex-shrink-0 flex items-center justify-between px-6 py-4 relative z-10">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className={cn(
            "w-11 h-11 rounded-full flex items-center justify-center transition-all",
            isInCall ? "bg-gradient-to-br from-green-400 to-emerald-500 animate-pulse" : "bg-gradient-to-br from-purple-500 to-cyan-500"
          )}>
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          
          {/* Name + Status */}
          <div>
            <h1 className="text-white font-semibold text-lg">Lisa</h1>
            
            {/* Inline Status Indicator */}
            <div className={cn(
              "flex items-center gap-1.5 text-xs font-medium transition-colors",
              status.color === 'green' && "text-green-400",
              status.color === 'purple' && "text-purple-400",
              status.color === 'yellow' && "text-yellow-400",
              status.color === 'blue' && "text-blue-400",
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
          
          {/* Live badge */}
          {isInCall && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs text-green-400 font-medium">Live</span>
            </motion.div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative z-10 px-6 py-4 overflow-hidden">
        
        {/* Transcript Area */}
        <div className="flex-1 max-w-2xl mx-auto w-full overflow-y-auto py-4 space-y-3">
          <AnimatePresence initial={false}>
            {transcriptLines.map((line, idx) => (
              <motion.div key={`${idx}-${line.time}`}
                initial={{ opacity: 0, y: 10, x: line.role === 'user' ? 20 : -20 }}
                animate={{ opacity: 1, y: 0, x: 0 }}
                className={cn("flex", line.role === 'user' ? "justify-end" : "justify-start")}>
                <div className={cn(
                  "max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed",
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-end">
              <div className="max-w-[85%] px-4 py-2.5 rounded-2xl rounded-br-md bg-cyan-500/10 border border-cyan-500/30 border-dashed">
                <p className="text-sm text-cyan-300/80 italic">{interimText}<span className="animate-pulse">▌</span></p>
              </div>
            </motion.div>
          )}
          
          {/* Spoken text (Lisa speaking) */}
          {currentSpokenText && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
              <div className="max-w-[85%] px-4 py-2.5 rounded-2xl rounded-bl-md bg-purple-500/10 border border-purple-500/30">
                <div className="flex items-center gap-2 mb-1">
                  <Volume2 className="w-3 h-3 text-purple-400 animate-pulse" />
                  <span className="text-xs text-purple-400">Lisa speaking...</span>
                </div>
                <p className="text-sm text-purple-200">{currentSpokenText}</p>
              </div>
            </motion.div>
          )}
          
          {/* Empty state */}
          {!transcriptLines.length && !interimText && !currentSpokenText && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-4">
                <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity }}
                  className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-purple-500/20 to-cyan-500/20 flex items-center justify-center border border-purple-500/20">
                  <Sparkles className="w-8 h-8 text-purple-400/50" />
                </motion.div>
                <p className="text-gray-500 text-sm">
                  {isInCall ? 'Start speaking...' : 'Start a call to begin'}
                </p>
                
                {isInCall && (
                  <div className="pt-2 space-y-1.5 text-xs text-gray-600">
                    <p>Try saying:</p>
                    <div className="flex flex-wrap justify-center gap-1.5 mt-2">
                      <span className="px-2 py-1 rounded bg-white/5">"Hello!"</span>
                      <span className="px-2 py-1 rounded bg-white/5">"Send email to Ali"</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Call Button - Clean, centered, no overlapping elements */}
        <div className="flex-shrink-0 pb-6 pt-4 flex justify-center">
          <AnimatePresence mode="wait">
            {!isInCall ? (
              <motion.button key="start" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={startCall}
                className="group relative w-20 h-20 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/25 hover:shadow-green-500/40 hover:scale-105 active:scale-95 transition-all">
                <Phone className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
              </motion.button>
            ) : (
              <motion.button key="end" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={endCall}
                className="group relative w-20 h-20 rounded-full bg-gradient-to-r from-red-500 to-rose-600 flex items-center justify-center shadow-lg shadow-red-500/25 hover:shadow-red-500/40 hover:scale-105 active:scale-95 transition-all">
                <PhoneOff className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Error Toast */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-4 right-4 max-w-md mx-auto z-50">
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-red-300 text-sm">{error}</p>
                <button onClick={() => setError(null)} className="text-red-400/60 text-xs mt-1 hover:text-red-400">Dismiss</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
