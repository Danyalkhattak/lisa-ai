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
} from 'lucide-react';
import { useMutation, useAction, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useUser } from "@clerk/clerk-react";
import { cn } from "@/lib/utils";

/**
 * CallPage — Always-Listening Voice Interface
 * 
 * Features:
 * - ALWAYS LISTENING: No tap needed - continuously listens when on call
 * - INTERRUPTION: Stops speaking immediately when user talks
 * - GUIDED EMAIL WORKFLOW: Step-by-step email sending via voice
 * - FEMALE VOICE: Auto-selects female TTS voice
 */

// Email workflow states
const EMAIL_STATES = {
  IDLE: 'idle',
  ASKING_WHO: 'asking_who',
  ASKING_WHAT: 'asking_what',
  CONFIRMING: 'confirming',
  SENDING: 'sending',
};

export default function CallPage() {
  const { user } = useUser();
  
  // ==================== State ====================
  const [isInCall, setIsInCall] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [statusMessage, setStatusMessage] = useState('Start call to talk to Lisa');
  
  // Transcript state
  const [transcriptLines, setTranscriptLines] = useState([]);
  const [interimText, setInterimText] = useState('');
  const [currentSpokenText, setCurrentSpokenText] = useState('');
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  
  // Email workflow state
  const [emailState, setEmailState] = useState(EMAIL_STATES.IDLE);
  const [emailContact, setEmailContact] = useState(null); // Found contact
  const [emailContent, setEmailContent] = useState(''); // What user wants to say
  const [emailDraft, setEmailDraft] = useState(null); // Generated draft
  
  // Refs
  const recognitionRef = useRef(null);
  const processingRef = useRef(false);
  const isMountedRef = useRef(true);
  const silenceTimeoutRef = useRef(null);
  const finalTranscriptRef = useRef('');
  const autoRestartTimeoutRef = useRef(null);
  
  // Conversation tracking
  const [conversationId, setConversationId] = useState(null);
  const conversationIdRef = useRef(null);
  
  // ==================== Convex Actions/Mutations/Queries ====================
  const generateReply = useAction(api.ai.chat);
  const createConversation = useMutation(api.conversations.create);
  const searchContacts = useQuery(api.contacts.search, { query: '' });
  const sendEmailMutation = useMutation(api.email.send);

  // ==================== Speech Recognition Setup ====================
  
  const initRecognition = useCallback(() => {
    if (recognitionRef.current) return recognitionRef.current;
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Speech recognition not supported. Please use Chrome.');
      return null;
    }
    
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    
    recognition.onresult = (event) => {
      if (!isMountedRef.current) return;
      
      let interim = '';
      let finalTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }
      
      if (interim) {
        console.log('[Lisa] Interim:', interim);
        setInterimText(interim);
        
        // Interruption handling
        if (isSpeaking && window.speechSynthesis) {
          console.log('[Lisa] User interrupted!');
          window.speechSynthesis.cancel();
          setIsSpeaking(false);
          setCurrentSpokenText('');
          setCurrentWordIndex(-1);
        }
        
        resetSilenceTimer();
      }
      
      if (finalTranscript) {
        console.log('[Lisa] Final:', finalTranscript);
        finalTranscriptRef.current += finalTranscript;
        resetSilenceTimer();
      }
    };
    
    recognition.onerror = (event) => {
      if (!isMountedRef.current) return;
      switch (event.error) {
        case 'not-allowed':
          setError('🎤 Microphone permission denied.');
          break;
        case 'aborted':
          break; // Normal
        default:
          // Restart on error if in call
          if (isInCall) {
            setTimeout(() => startListening(), 500);
          }
      }
    };
    
    recognition.onend = () => {
      if (!isMountedRef.current) return;
      setIsListening(false);
      
      // Process remaining text
      if (finalTranscriptRef.current.trim() && !processingRef.current) {
        processAndSend(finalTranscriptRef.current);
        finalTranscriptRef.current = '';
      }
      
      // Auto-restart
      if (isInCall && !processingRef.current && isMountedRef.current) {
        autoRestartTimeoutRef.current = setTimeout(() => {
          if (isInCall && isMountedRef.current) startListening();
        }, 300);
      }
    };
    
    recognition.onstart = () => {
      if (!isMountedRef.current) return;
      setIsListening(true);
      setError(null);
      setStatusMessage('Listening...');
    };
    
    recognitionRef.current = recognition;
    return recognition;
  }, [isSpeaking, isInCall]);

  const resetSilenceTimer = useCallback(() => {
    if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
    
    silenceTimeoutRef.current = setTimeout(() => {
      if (finalTranscriptRef.current.trim() && isMountedRef.current && !processingRef.current) {
        const textToProcess = finalTranscriptRef.current.trim();
        finalTranscriptRef.current = '';
        processAndSend(textToProcess);
      }
    }, 1500);
  }, []);

  const startListening = useCallback(() => {
    if (!isMountedRef.current) return;
    const recognition = initRecognition();
    if (!recognition) return;
    
    try {
      try { recognition.abort(); } catch (e) {}
      setTimeout(() => {
        if (isMountedRef.current) recognition.start();
      }, 100);
    } catch (err) {
      console.error('[Lisa] Failed to start:', err);
    }
  }, [initRecognition]);

  const stopListening = useCallback(() => {
    if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
    if (autoRestartTimeoutRef.current) clearTimeout(autoRestartTimeoutRef.current);
    if (recognitionRef.current) try { recognitionRef.current.stop(); } catch (e) {}
    setIsListening(false);
  }, []);

  /**
   * Check if message is about sending an email
   */
  function isEmailIntent(text) {
    const lower = text.toLowerCase();
    return (
      lower.includes('send') && 
      (lower.includes('email') || lower.includes('mail') || lower.includes('message'))
    );
  }

  /**
   * Extract name from "send email to X" pattern
   */
  function extractRecipientName(text) {
    const patterns = [
      /send\s+(?:an?\s+)?(?:email|mail)\s+to\s+(.+?)(?:\s*(?:and say|about|that|with)|$)/i,
      /email\s+(?:to|for)\s+(.+?)$/i,
      /send\s+(.+?)\s+(?:an?\s+)?(?:email|mail)/i,
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim().replace(/[.!?,]$/, '');
      }
    }
    return null;
  }

  /**
   * Process text and determine action (chat or email)
   */
  const processAndSend = useCallback(async (text) => {
    if (!text.trim() || processingRef.current || !isMountedRef.current) return;
    
    stopListening();
    setInterimText('');
    addTranscriptLine('user', text.trim());
    
    processingRef.current = true;
    setIsProcessing(true);
    setStatusMessage('Thinking...');
    
    try {
      // Check for CANCEL command
      if (text.toLowerCase().includes('cancel')) {
        setEmailState(EMAIL_STATES.IDLE);
        setEmailContact(null);
        setEmailContent('');
        setEmailDraft(null);
        await speakText("Okay, I've cancelled that.");
        return;
      }

      // Check for YES confirmation during email flow
      if ((text.toLowerCase().startsWith('yes') || text.toLowerCase().startsWith('sure') || text.toLowerCase().startsWith('ok') || text.toLowerCase().startsWith('please do'))
          && emailState === EMAIL_STATES.CONFIRMING && emailDraft) {
        await actuallySendEmail();
        return;
      }

      // Check for NO during email flow
      if ((text.toLowerCase().startsWith('no') || text.toLowerCase().includes("don't"))
          && (emailState === EMAIL_STATES.CONFIRMING || emailState === EMAIL_STATES.ASKING_WHO)) {
        setEmailState(EMAIL_STATES.IDLE);
        setEmailContact(null);
        await speakText("No problem! Is there anything else I can help you with?");
        return;
      }

      // Handle email workflow states
      if (emailState === EMAIL_STATES.ASKING_WHO) {
        // User said who they want to email
        const contactName = text.trim();
        await handleEmailRecipient(contactName);
        return;
      }

      if (emailState === EMAIL_STATES.ASKING_WHAT) {
        // User said what they want in the email
        setEmailContent(text.trim());
        await generateEmailDraft(text.trim());
        return;
      }

      // Check if this is an email intent
      if (isEmailIntent(text)) {
        const recipientName = extractRecipientName(text);
        
        if (recipientName) {
          // They specified who to email
          setStatusMessage('Finding contact...');
          addTranscriptLine('assistant', `Looking up ${recipientName} in your contacts...`);
          await handleEmailRecipient(recipientName);
        } else {
          // Ask who to email
          setEmailState(EMAIL_STATES.ASKING_WHO);
          await speakText("Who would you like to send this email to?");
        }
        return;
      }

      // Normal chat flow
      await handleNormalChat(text);
      
    } catch (err) {
      console.error('[Lisa] Error:', err);
      if (isMountedRef.current) {
        addTranscriptLine('assistant', 'Sorry, something went wrong. Could you repeat?');
      }
    } finally {
      processingRef.current = false;
      if (isMountedRef.current) {
        setIsProcessing(false);
        if (emailState === EMAIL_STATES.IDLE) {
          setStatusMessage('Listening...');
          if (isInCall) {
            setTimeout(() => {
              if (isMountedRef.current && isInCall) startListening();
            }, 500);
          }
        }
      }
    }
  }, [emailState, emailDraft, isInCall, stopListening, startListening]);

  /**
   * Handle finding email recipient
   */
  async function handleEmailRecipient(name) {
    setStatusMessage('Searching contacts...');
    
    // Search contacts
    try {
      const contactsResult = await searchContacts.refine(name).catch(() => []);
      const contacts = Array.isArray(contactsResult) ? contactsResult : [];
      
      // Find best match (case-insensitive)
      const match = contacts.find(c => 
        c.name.toLowerCase() === name.toLowerCase() ||
        c.name.toLowerCase().includes(name.toLowerCase()) ||
        name.toLowerCase().includes(c.name.toLowerCase())
      );
      
      if (match) {
        setEmailContact(match);
        setEmailState(EMAIL_STATES.ASKING_WHAT);
        addTranscriptLine('assistant', `Found ${match.name} (${match.email}).`);
        await speakText(`I found ${match.name} in your contacts. What would you like the email to say?`);
      } else {
        // Contact not found
        setEmailState(EMAIL_STATES.IDLE);
        await speakText(
          `I couldn't find anyone named ${name} in your contacts. Would you like to add them first? You can go to the Contacts page to add them.`
        );
      }
    } catch (err) {
      console.error('[Lisa] Contact search error:', err);
      setEmailState(EMAIL_STATES.IDLE);
      await speakText("I had trouble searching your contacts. Please try again.");
    }
  }

  /**
   * Generate email draft using Gemini
   */
  async function generateEmailDraft(userContent) {
    setStatusMessage('Generating email...');
    
    try {
      // Create temp conversation for email generation
      let convId = conversationIdRef.current || conversationId;
      if (!convId) {
        convId = await createConversation({ title: 'Voice Call' });
        setConversationId(convId);
        conversationIdRef.current = convId;
      }

      // Use Gemini to format the email
      const result = await generateReply({
        conversationId: convId,
        message: `Generate a professional email based on this request: "${userContent}". The recipient is ${emailContact.name}. Return ONLY the subject line and body, formatted as:
Subject: [subject]

[body]`,
      });
      
      if (result?.content) {
        // Parse the response
        const content = result.content;
        let subject = '';
        let body = content;
        
        const subjectMatch = content.match(/Subject:\s*(.+?)(?:\n\n|\n)/i);
        if (subjectMatch) {
          subject = subjectMatch[1].trim();
          body = content.replace(/Subject:\s*.+?(?:\n\n|\n)/i, '').trim();
        } else {
          subject = `Message from ${user.firstName || 'Me'}`;
        }
        
        const draft = { subject, body, to: emailContact.email };
        setEmailDraft(draft);
        setEmailState(EMAIL_STATES.CONFIRMING);
        
        // Show confirmation
        const confirmMsg = `Here's the email I'll send to ${emailContact.name}:

Subject: ${subject}

${body.substring(0, 200)}${body.length > 200 ? '...' : ''}

Should I send it?`;
        
        addTranscriptLine('assistant', confirmMsg);
        await speakText(`I'll send this email to ${emailContact.name}. The subject is "${subject}". Should I go ahead and send it?`);
      }
    } catch (err) {
      console.error('[Lisa] Email generation error:', err);
      setEmailState(EMAIL_STATES.IDLE);
      await speakText("I had trouble generating the email. Would you like to try again?");
    }
  }

  /**
   * Actually send the email
   */
  async function actuallySendEmail() {
    if (!emailDraft) return;
    
    setEmailState(EMAIL_STATES.SENDING);
    setStatusMessage('Sending email...');
    
    try {
      await sendEmailMutation({
        to: emailDraft.to,
        subject: emailDraft.subject,
        body: emailDraft.body,
      });
      
      addTranscriptLine('assistant', `✅ Email sent to ${emailContact.name}!`);
      await speakText(`Done! Your email has been sent to ${emailContact.name}.`);
      
      // Reset email state
      setEmailState(EMAIL_STATES.IDLE);
      setEmailContact(null);
      setEmailContent('');
      setEmailDraft(null);
      
    } catch (err) {
      console.error('[Lisa] Send error:', err);
      setEmailState(EMAIL_STATES.IDLE);
      await speakText("Sorry, I couldn't send the email. Please check your settings and try again.");
    }
  }

  /**
   * Handle normal chat (non-email)
   */
  async function handleNormalChat(text) {
    // Create conversation if needed
    let convId = conversationIdRef.current || conversationId;
    if (!convId) {
      convId = await createConversation({ title: 'Voice Call' });
      if (!isMountedRef.current) return;
      setConversationId(convId);
      conversationIdRef.current = convId;
    }
    
    console.log('[Lisa] Sending to AI:', text.substring(0, 50));
    
    const result = await generateReply({
      conversationId: convId,
      message: text.trim(),
    });
    
    if (!isMountedRef.current) return;
    
    if (result?.content) {
      await speakText(result.content);
    }
  }

  /**
   * Add line to transcript
   */
  const addTranscriptLine = useCallback((role, text) => {
    setTranscriptLines(prev => [...prev.slice(-30), {
      role,
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
  }, []);

  /**
   * Speak text using female TTS
   */
  const speakText = useCallback((text) => {
    return new Promise((resolve) => {
      if (!text || !text.trim() || !isMountedRef.current) { resolve(); return; }

      let cleanText = text
        .replace(/```[\s\S]*?```/g, '')
        .replace(/`[^`]+`/g, '')
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/\*([^*]+)\*/g, '$1')
        .replace(/https?:\/\/[^\s]+/g, '')
        .replace(/^[\s]*[-•*]\s+/gm, '')
        .trim();
      
      if (!cleanText) { resolve(); return; }

      console.log('[Lisa] Speaking:', cleanText.substring(0, 60));
      setIsSpeaking(true);
      setCurrentSpokenText(cleanText);
      setCurrentWordIndex(0);
      setStatusMessage('Lisa is speaking...');
      
      const utterance = new SpeechSynthesisUtterance(cleanText);
      
      // Female voice selection
      const voices = window.speechSynthesis.getVoices();
      const femaleVoice = voices.find(v => 
        v.name.includes('Samantha') || v.name.includes('Victoria') ||
        v.name.includes('Karen') || v.name.includes('Tessa') ||
        v.name.includes('Zira') || v.name.includes('Google US English Female')
      ) || voices.find(v => 
        v.lang?.startsWith('en') && (v.name.includes('Female') || v.name.includes('Woman'))
      ) || voices.find(v => 
        v.lang?.startsWith('en') && !v.name.toLowerCase().includes('male')
      );
      
      if (femaleVoice) {
        utterance.voice = femaleVoice;
      }
      
      utterance.rate = 0.95;
      utterance.pitch = 1.1;
      
      let wordIndex = 0;
      
      utterance.onboundary = (event) => {
        if (event.name === 'word' && isMountedRef.current) {
          wordIndex++;
          setCurrentWordIndex(wordIndex);
        }
      };
      
      utterance.onstart = () => {
        if (isMountedRef.current) {
          setIsSpeaking(true);
          setCurrentWordIndex(0);
        }
      };
      
      utterance.onend = () => {
        if (isMountedRef.current) {
          setIsSpeaking(false);
          setCurrentSpokenText('');
          setCurrentWordIndex(-1);
          addTranscriptLine('assistant', cleanText);
        }
        resolve();
      };
      
      utterance.onerror = (event) => {
        if (event.error !== 'interrupted') console.error('[Lisa] Speech error:', event.error);
        if (isMountedRef.current) {
          setIsSpeaking(false);
          setCurrentSpokenText('');
          setCurrentWordIndex(-1);
        }
        resolve();
      };
      
      window.speechSynthesis.speak(utterance);
    });
  }, []);

  // ==================== Call Control ====================
  
  const startCall = useCallback(() => {
    console.log('[Lisa] Starting call');
    setIsInCall(true);
    setTranscriptLines([]);
    setError(null);
    setConversationId(null);
    conversationIdRef.current = null;
    finalTranscriptRef.current = '';
    setEmailState(EMAIL_STATES.IDLE);
    setEmailContact(null);
    setEmailContent('');
    setEmailDraft(null);
    setStatusMessage('Connecting...');
    
    setTimeout(() => {
      if (isMountedRef.current) {
        startListening();
        setStatusMessage('Listening...');
      }
    }, 500);
  }, [startListening]);

  const endCall = useCallback(() => {
    console.log('[Lisa] Ending call');
    
    if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
    if (autoRestartTimeoutRef.current) clearTimeout(autoRestartTimeoutRef.current);
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
    setEmailState(EMAIL_STATES.IDLE);
    setEmailContact(null);
    setEmailContent('');
    setEmailDraft(null);
    setStatusMessage('Start call to talk to Lisa');
  }, []);

  // ==================== Lifecycle ====================
  
  useEffect(() => {
    isMountedRef.current = true;
    
    const loadVoices = () => window.speechSynthesis?.getVoices();
    if (window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
      loadVoices();
    }
    
    return () => {
      isMountedRef.current = false;
      endCall();
    };
  }, [endCall]);

  // ==================== Render ====================
  
  return (
    <div className="h-screen w-full bg-[#09090B] flex flex-col overflow-hidden relative">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Header */}
      <header className="flex-shrink-0 flex items-center justify-between px-6 py-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center transition-all",
            isInCall ? "bg-gradient-to-br from-green-400 to-emerald-500 animate-pulse" : "bg-gradient-to-br from-purple-500 to-cyan-500"
          )}>
            <Sparkles className={cn("w-6 h-6 text-white")} />
          </div>
          <div>
            <h1 className="text-white font-semibold text-lg">Lisa</h1>
            <p className={cn(
              "text-xs font-medium transition-colors",
              !isInCall ? "text-gray-500" :
              isProcessing ? "text-yellow-400" :
              isSpeaking ? "text-purple-400" :
              isListening ? "text-green-400" :
              emailState !== EMAIL_STATES.IDLE ? "text-blue-400" :
              "text-gray-400"
            )}>
              {!isInCall ? 'Tap to start' :
               isProcessing ? 'Thinking...' :
               isSpeaking ? 'Speaking...' :
               isListening ? '🎤 Listening...' :
               emailState === EMAIL_STATES.ASKING_WHO ? '📧 Who should I email?' :
               emailState === EMAIL_STATES.ASKING_WHAT ? '✉️ What should it say?' :
               emailState === EMAIL_STATES.CONFIRMING ? '📋 Confirm send?' :
               emailState === EMAIL_STATES.SENDING ? '📤 Sending...' :
               statusMessage}
            </p>
          </div>
        </div>
        
        {isInCall && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/30">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-green-400 font-medium">Live</span>
          </motion.div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-between relative z-10 px-6 py-4">
        
        {/* Transcript */}
        <div className="flex-1 w-full max-w-2xl overflow-y-auto py-4 space-y-3">
          <AnimatePresence initial={false}>
            {transcriptLines.map((line, idx) => (
              <motion.div key={`${idx}-${line.timestamp}`}
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
                    <span className="text-xs opacity-40">{line.timestamp}</span>
                  </div>
                  <p>{line.text}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {/* Interim text */}
          {interimText && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-end">
              <div className="max-w-[85%] px-4 py-2.5 rounded-2xl rounded-br-md bg-cyan-500/10 border border-cyan-500/30 border-dashed">
                <p className="text-sm text-cyan-300/80 italic">{interimText}<span className="animate-pulse">▌</span></p>
              </div>
            </motion.div>
          )}
          
          {/* Spoken text with highlighting */}
          {currentSpokenText && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
              <div className="max-w-[85%] px-4 py-2.5 rounded-2xl rounded-bl-md bg-purple-500/10 border border-purple-500/30">
                <div className="flex items-center gap-2 mb-1">
                  <Volume2 className="w-3 h-3 text-purple-400 animate-pulse" />
                  <span className="text-xs text-purple-400">Lisa speaking...</span>
                </div>
                <p className="text-sm text-purple-200">
                  {currentSpokenText.split(' ').map((word, idx) => (
                    <span key={idx} className={cn(
                      "transition-colors duration-100",
                      idx <= currentWordIndex ? "text-white font-medium" : "text-purple-300/50"
                    )}>{word} </span>
                  ))}
                </p>
              </div>
            </motion.div>
          )}
          
          {/* Empty state */}
          {!transcriptLines.length && !interimText && !currentSpokenText && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-4">
                <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity }}
                  className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-purple-500/20 to-cyan-500/20 flex items-center justify-center border border-purple-500/20">
                  <Sparkles className="w-10 h-10 text-purple-400/50" />
                </motion.div>
                <p className="text-gray-500 text-sm">
                  {isInCall ? 'Start speaking... Lisa is listening!' : 'Start a call to begin'}
                </p>
                
                {/* Quick tips when in call */}
                {isInCall && (
                  <div className="pt-4 space-y-2 text-xs text-gray-600">
                    <p>Try saying:</p>
                    <div className="flex flex-wrap justify-center gap-2 mt-2">
                      <span className="px-2 py-1 rounded bg-white/5">"Hello!"</span>
                      <span className="px-2 py-1 rounded bg-white/5">"Send email to Ali"</span>
                      <span className="px-2 py-1 rounded bg-white/5">"What's the weather?"</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Control Button */}
        <div className="flex-shrink-0 pb-8 pt-4 flex justify-center">
          <AnimatePresence mode="wait">
            {!isInCall ? (
              <motion.button key="start" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={startCall}
                className="group relative w-20 h-20 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/25 hover:shadow-green-500/40 hover:scale-105 active:scale-95 transition-all">
                <Phone className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
                <span className="absolute -bottom-8 text-xs text-green-400 font-medium">Start Call</span>
              </motion.button>
            ) : (
              <motion.button key="end" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={endCall}
                className="group relative w-20 h-20 rounded-full bg-gradient-to-r from-red-500 to-rose-600 flex items-center justify-center shadow-lg shadow-red-500/25 hover:shadow-red-500/40 hover:scale-105 active:scale-95 transition-all">
                <PhoneOff className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
                <span className="absolute -bottom-8 text-xs text-red-400 font-medium">End Call</span>
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 left-4 right-4 max-w-md mx-auto z-50">
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

      {/* Status bar */}
      {isInCall && (
        <div className="absolute bottom-4 left-0 right-0 flex justify-center">
          <div className={cn(
            "px-4 py-1.5 rounded-full text-xs font-medium backdrop-blur-sm transition-colors",
            isListening ? "bg-green-500/10 text-green-400 border border-green-500/20" :
            isSpeaking ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" :
            isProcessing ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20" :
            emailState !== EMAIL_STATES.IDLE ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" :
            "bg-gray-500/10 text-gray-400 border border-gray-500/20"
          )}>
            {isListening && (
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                Always Listening...
              </span>
            )}
            {isSpeaking && (
              <span className="flex items-center gap-2">
                <Volume2 className="w-3 h-3" /> Speaking... (Interrupt by talking)
              </span>
            )}
            {isProcessing && (
              <span className="flex items-center gap-2">
                <Loader2 className="w-3 h-3 animate-spin" /> Thinking...
              </span>
            )}
            {emailState === EMAIL_STATES.ASKING_WHO && (
              <span className="flex items-center gap-2"><User className="w-3 h-3" /> Waiting for contact name...</span>
            )}
            {emailState === EMAIL_STATES.ASKING_WHAT && (
              <span className="flex items-center gap-2"><Mail className="w-3 h-3" /> Waiting for email content...</span>
            )}
            {emailState === EMAIL_STATES.CONFIRMING && (
              <span className="flex items-center gap-2">Say "Yes" to send or "No" to cancel</span>
            )}
            {emailState === EMAIL_STATES.SENDING && (
              <span className="flex items-center gap-2"><Loader2 className="w-3 h-3 animate-spin" /> Sending email...</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
