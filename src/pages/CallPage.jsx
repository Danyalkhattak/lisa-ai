import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Phone,
  PhoneOff,
  Volume2,
  Loader2,
  AlertCircle,
  Settings,
  Mic,
  MicOff,
  X,
  Home,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useAction } from "convex/react";
import { api } from "@convex/_generated/api";
import { useUser, useAuth } from "@clerk/clerk-react";
import { cn } from "@/lib/utils";

/**
 * Convex HTTP actions (like the streaming TTS endpoint below) are
 * served from the `*.convex.site` domain — separate from
 * `*.convex.cloud`, which is the websocket/query-mutation-action API
 * domain used by the regular Convex client. Falls back to deriving it
 * from VITE_CONVEX_URL for setups where VITE_CONVEX_SITE_URL hasn't
 * been added to .env.local yet.
 */
const CONVEX_SITE_URL =
  import.meta.env.VITE_CONVEX_SITE_URL ||
  import.meta.env.VITE_CONVEX_URL?.replace(/\.convex\.cloud\/?$/, ".convex.site");

/**
 * True on iOS (any browser — they're all WebKit under Apple's rules)
 * and on desktop Safari specifically. This is what decides whether
 * `processAndSend` below uses the streaming `/chat-stream` HTTP
 * fetch instead of `useAction(api.ai.chat)` — see the comment on
 * that branch for why. Computed once at module load; the browser
 * doesn't change mid-session.
 */
function detectAppleWebKit() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const isIOSDevice =
    /iPad|iPhone|iPod/.test(ua) ||
    // iPadOS 13+ reports as "MacIntel" with touch support, so UA
    // sniffing alone misses iPads unless we also check for touch.
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  // Matches Safari on macOS while excluding Chrome/Firefox/Edge —
  // including their iOS variants (CriOS/FxiOS/EdgiOS), which are
  // already covered by isIOSDevice above.
  const isDesktopSafari = /^((?!chrome|android|crios|fxios|edgios).)*safari/i.test(ua);
  return isIOSDevice || isDesktopSafari;
}

const IS_APPLE_WEBKIT = detectAppleWebKit();

/**
 * Plays a streamed `audio/mpeg` response body progressively via the
 * MediaSource API, starting playback as soon as the first chunk is
 * buffered rather than waiting for the whole clip to download. This
 * is what gives the ElevenLabs path its low latency.
 */
function playMseAudioStream(bodyStream, { onStart } = {}) {
  return new Promise((resolve, reject) => {
    const mediaSource = new MediaSource();
    const audio = new Audio();
    const objectUrl = URL.createObjectURL(mediaSource);
    audio.src = objectUrl;

    let settled = false;
    const cleanup = () => {
      try { URL.revokeObjectURL(objectUrl); } catch { /* noop */ }
    };
    const fail = (err) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(err instanceof Error ? err : new Error(String(err)));
    };
    const succeed = () => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve();
    };

    audio.onended = succeed;
    audio.onerror = () => fail(new Error("MSE audio element error"));

    mediaSource.addEventListener(
      "sourceopen",
      async () => {
        let sourceBuffer;
        try {
          sourceBuffer = mediaSource.addSourceBuffer("audio/mpeg");
        } catch (err) {
          fail(err);
          return;
        }

        const reader = bodyStream.getReader();
        let started = false;

        const waitForNotUpdating = () =>
          sourceBuffer.updating
            ? new Promise((r) => sourceBuffer.addEventListener("updateend", r, { once: true }))
            : Promise.resolve();

        const appendChunk = (chunk) =>
          new Promise((res, rej) => {
            const onUpdateEnd = () => {
              sourceBuffer.removeEventListener("error", onError);
              res();
            };
            const onError = (e) => {
              sourceBuffer.removeEventListener("updateend", onUpdateEnd);
              rej(e);
            };
            sourceBuffer.addEventListener("updateend", onUpdateEnd, { once: true });
            sourceBuffer.addEventListener("error", onError, { once: true });
            try {
              sourceBuffer.appendBuffer(chunk);
            } catch (err) {
              sourceBuffer.removeEventListener("updateend", onUpdateEnd);
              sourceBuffer.removeEventListener("error", onError);
              rej(err);
            }
          });

        const pump = async () => {
          const { done, value } = await reader.read();

          if (done) {
            await waitForNotUpdating();
            if (mediaSource.readyState === "open") {
              try { mediaSource.endOfStream(); } catch { /* noop */ }
            }
            return;
          }

          await waitForNotUpdating();
          await appendChunk(value);

          if (!started) {
            // First chunk is buffered — start playback now instead of
            // waiting for the rest of the stream to arrive.
            started = true;
            audio.play().catch(fail);
            onStart?.();
          }

          return pump();
        };

        pump().catch(fail);
      },
      { once: true },
    );
  });
}

/**
 * Fallback for browsers without MediaSource 'audio/mpeg' support
 * (e.g. Safari): waits for the whole stream, then plays it as a blob.
 * Still faster than the old base64-over-Convex-action round trip and
 * still uses the fast Flash v2.5 model — just not progressively
 * played while downloading.
 */
async function playBlobAudioStream(bodyStream, { onStart } = {}) {
  const blob = await new Response(bodyStream).blob();
  return new Promise((resolve, reject) => {
    const audio = new Audio(URL.createObjectURL(blob));
    audio.onended = resolve;
    audio.onerror = () => reject(new Error("Audio playback failed"));
    audio.play().then(() => onStart?.()).catch(reject);
  });
}

/**
 * CallPage — Premium Voice Assistant Interface
 * 
 * Design Philosophy:
 * - Clean, focused interface
 * - Clear status indicators
 * - Smooth micro-interactions
 * - Professional glassmorphism
 */

export default function CallPage() {
  const { user } = useUser();
  const { getToken } = useAuth();
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
  const revealIntervalRef = useRef(null);
  const transcriptEndRef = useRef(null);

  // Convex
  const generateReply = useAction(api.ai.chat);
  const createConversation = useMutation(api.conversations.create);
  const warmElevenLabs = useAction(api.ttsStream.warm);

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
      try { recognitionRef.current.stop(); } catch (e) { }
    }
    setIsListening(false);
  }, []);

  // ==================== Core Processing ====================

  // Streaming counterpart to `useAction(api.ai.chat)`, used only on
  // iOS/macOS Safari (see IS_APPLE_WEBKIT above). Hits the
  // `/chat-stream` Convex HTTP action directly with `fetch` — the
  // same plain-HTTPS approach already used for `/tts-stream` — and
  // reads the response body as it streams in, calling `onDelta` with
  // the accumulated text after every chunk so the UI can show the
  // reply as it's generated instead of a static spinner. Resolves
  // with the final, complete text once the stream ends.
  const generateReplyStream = useCallback(async (message, conversationId, onDelta) => {
    if (!CONVEX_SITE_URL) {
      throw new Error('Convex site URL is not configured.');
    }

    const token = await getToken({ template: 'convex' }).catch(() => null);
    if (!token) {
      throw new Error('Not authenticated.');
    }

    const response = await fetch(`${CONVEX_SITE_URL}/chat-stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ message, conversationId }),
    });

    if (!response.ok || !response.body) {
      const errText = await response.text().catch(() => '');
      throw new Error(errText || `Request failed (${response.status})`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      if (chunk) {
        fullText += chunk;
        onDelta?.(fullText);
      }
    }

    return fullText.trim();
  }, [getToken]);

  const processAndSend = useCallback(async (text) => {
    if (!text.trim() || !mountedRef.current) return;

    console.log('[Lisa] Processing:', text.trim());
    const cleanText = text.trim();
    setInterimText('');
    addLine('user', cleanText);

    setIsProcessing(true);

    try {
      if (!conversationIdRef.current) {
        const convId = await createConversation({
          title: cleanText.slice(0, 50) + (cleanText.length > 50 ? '...' : ''),
        });
        conversationIdRef.current = convId;
      }

      let responseText;

      if (IS_APPLE_WEBKIT) {
        // iOS/macOS Safari: `useAction(api.ai.chat)` round-trips over
        // Convex's WebSocket connection, which has been observed to
        // leave this promise unresolved on WebKit even after the
        // server finished and saved the reply — the UI gets stuck on
        // "Thinking..." forever. Use the plain-HTTPS streaming
        // endpoint instead (same approach already used for
        // /tts-stream), and show the reply as it streams in rather
        // than waiting for the full thing.
        try {
          responseText = await generateReplyStream(
            cleanText,
            conversationIdRef.current,
            (partial) => {
              if (mountedRef.current) setCurrentSpokenText(partial);
            },
          );
        } finally {
          if (mountedRef.current) setCurrentSpokenText('');
        }
      } else {
        const response = await generateReply({
          message: cleanText,
          conversationId: conversationIdRef.current,
        });
        responseText = response?.content || response;
      }

      if (!mountedRef.current) return;

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
  }, [generateReply, createConversation, generateReplyStream]);

  // ==================== Transcript ====================

  const addLine = useCallback((role, text) => {
    setTranscriptLines(prev => [...prev.slice(-30), {
      role,
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
  }, []);

  // ==================== Text Reveal ====================

  // Stops any in-progress word-by-word reveal (e.g. when speech ends
  // early or is interrupted).
  const stopWordReveal = useCallback(() => {
    if (revealIntervalRef.current) {
      clearInterval(revealIntervalRef.current);
      revealIntervalRef.current = null;
    }
  }, []);

  // Reveals `fullText` progressively, one word at a time, instead of
  // dumping the whole reply on screen the instant it arrives. Used for
  // the ElevenLabs path, where we don't get per-word timing from the
  // audio itself — so we approximate natural speaking pace. Started
  // right when audio playback actually begins (via onStart), not when
  // the network request kicks off, so text and voice start together.
  const revealWordByWord = useCallback((fullText, msPerWord = 210) => {
    stopWordReveal();
    const words = fullText.split(/\s+/).filter(Boolean);
    let idx = 0;
    setCurrentSpokenText('');
    revealIntervalRef.current = setInterval(() => {
      idx += 1;
      setCurrentSpokenText(words.slice(0, idx).join(' '));
      if (idx >= words.length) {
        stopWordReveal();
      }
    }, msPerWord);
  }, [stopWordReveal]);

  // ==================== TTS ====================

  // Browser SpeechSynthesis fallback — used automatically whenever
  // ElevenLabs isn't configured (no API key set) or a request to it fails.
  const speakWithBrowserTTS = useCallback((clean) => {
    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(clean);

      const voices = window.speechSynthesis.getVoices();
      const female = voices.find(v =>
        /^(Samantha|Victoria|Karen|Tessa|Zira|Google US English Female)/i.test(v.name)
      ) || voices.find(v =>
        v.lang?.startsWith('en') && /female|woman/i.test(v.name)
      );

      if (female) utterance.voice = female;
      utterance.rate = 0.95;
      utterance.pitch = 1.1;

      // The browser synthesizer fires a real 'word' boundary event as
      // each word is actually spoken — use that instead of a timer so
      // the on-screen text is exactly in sync with the voice.
      utterance.onboundary = (event) => {
        if (!mountedRef.current) return;
        if (event.name && event.name !== 'word') return;
        setCurrentSpokenText(clean.slice(0, event.charIndex).trimEnd());
      };

      utterance.onend = () => {
        console.log('[Lisa] Speech ended (browser TTS)');
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
  }, [addLine]);

  // Streams ElevenLabs speech via the /tts-stream HTTP action so audio
  // can start playing before the full clip has been generated/downloaded.
  // Returns `true` if ElevenLabs successfully spoke the text, `false` if
  // it's not configured (caller should fall back to browser TTS). Throws
  // on genuine playback/network errors so the caller's catch block can
  // fall back the same way the old implementation did.
  const speakWithElevenLabsStream = useCallback(async (clean, { onStart } = {}) => {
    if (!CONVEX_SITE_URL) return false;

    const token = await getToken({ template: 'convex' }).catch(() => null);
    if (!token) return false;

    const response = await fetch(`${CONVEX_SITE_URL}/tts-stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ text: clean }),
    });

    // 204/non-2xx means ElevenLabs isn't configured or the request
    // failed server-side — signal the caller to fall back silently,
    // same as the old action returning `null`.
    if (!response.ok || !response.body) return false;
    if (!mountedRef.current) return true;

    console.log('[Lisa] Speaking via ElevenLabs (streamed)');

    if (typeof MediaSource !== 'undefined' && MediaSource.isTypeSupported('audio/mpeg')) {
      await playMseAudioStream(response.body, { onStart });
    } else {
      await playBlobAudioStream(response.body, { onStart });
    }

    return true;
  }, [getToken]);

  const speak = useCallback((text, options = {}) => {
    return new Promise((resolve) => {
      let resolved = false;

      // Clean up and resolve once
      const finish = (shouldAddLine = true) => {
        if (resolved) return;
        resolved = true;

        // Clear any scheduled timeout
        if (options.timeoutId) {
          clearTimeout(options.timeoutId);
          options.timeoutId = null;
        }

        // Stop word‑by‑word reveal
        stopWordReveal();

        if (mountedRef.current) {
          setIsSpeaking(false);
          setCurrentSpokenText('');
          if (shouldAddLine) {
            // `clean` is defined below and captured in closure
            addLine('assistant', clean);
          }
        }
        resolve();
      };

      // --- Main TTS logic (unchanged) ---
      if (!text?.trim() || !mountedRef.current) {
        finish(false);
        return;
      }

      const clean = text
        .replace(/```[\s\S]*?```/g, '')
        .replace(/`[^`]+`/g, '')
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/https?:\/\/[^\s]+/g, '')
        .trim();

      if (!clean) {
        finish(false);
        return;
      }

      setIsSpeaking(true);
      setCurrentSpokenText('');

      // --- Timeout (only for Apple WebKit) ---
      if (IS_APPLE_WEBKIT) {
        const timeoutMs = options.timeout ?? 30000; // 30 seconds
        options.timeoutId = setTimeout(() => {
          console.warn('[Lisa] TTS timed out on Apple WebKit – forcing completion');
          // Cancel any ongoing speech
          if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
          }
          stopWordReveal();
          // Force finish and add the assistant line
          finish(true);
        }, timeoutMs);
      }

      // --- Try ElevenLabs streaming ---
      (async () => {
        try {
          const spoke = await speakWithElevenLabsStream(clean, {
            onStart: () => {
              if (mountedRef.current) revealWordByWord(clean);
            },
          });
          if (spoke) {
            console.log('[Lisa] Speech ended (ElevenLabs)');
            finish(true);
            return;
          }
        } catch (err) {
          console.error('[Lisa] ElevenLabs streaming TTS failed, falling back to browser TTS:', err);
          stopWordReveal();
        }

        // --- Fallback to browser TTS ---
        if (!mountedRef.current) {
          finish(false);
          return;
        }
        try {
          await speakWithBrowserTTS(clean);
          finish(true);
        } catch (err) {
          console.error('[Lisa] Browser TTS failed:', err);
          finish(true); // still add the line
        }
      })();
    });
  }, [speakWithElevenLabsStream, speakWithBrowserTTS, revealWordByWord, stopWordReveal, addLine]);

  // ==================== Call Control ====================

  const startCall = useCallback(() => {
    setIsInCall(true);
    setTranscriptLines([]);
    setError(null);
    conversationIdRef.current = null;

    // Pre-warm the ElevenLabs voice-id cache now, ahead of the first
    // reply, so the first streamed TTS request doesn't pay for an
    // extra "list voices" round trip. Best-effort — silently ignored
    // if ElevenLabs isn't configured or this fails.
    warmElevenLabs().catch(() => { });
  }, [warmElevenLabs]);

  const endCall = useCallback(() => {
    stopListening();
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    stopWordReveal();

    setIsInCall(false);
    setIsListening(false);
    setIsSpeaking(false);
    setIsProcessing(false);
    setInterimText('');
    setCurrentSpokenText('');
  }, [stopListening, stopWordReveal]);

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

  // ==================== Auto-scroll ====================

  // Keeps the transcript pinned to the latest message/word as new
  // lines arrive or the current line streams in word by word.
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [transcriptLines, interimText, currentSpokenText]);

  // ==================== Lifecycle ====================

  useEffect(() => {
    mountedRef.current = true;

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
    if (isProcessing) return { icon: Loader2, label: 'Thinking...', color: 'amber', spin: true };
    if (isSpeaking) return { icon: Volume2, label: 'Speaking', color: 'violet' };
    if (isListening) return { label: 'Listening', color: 'emerald' };
    return { label: isInCall ? 'Ready' : 'Tap to start', color: 'slate' };
  };

  const status = getStatusConfig();

  // ==================== Render ====================

  return (
    <div className="h-screen w-full bg-[#09090B] flex flex-col overflow-hidden relative">
      {/* Animated Background - Refined */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={cn(
          "absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-[120px] transition-all duration-1000 ease-out",
          isListening ? "bg-emerald-500/18" : isSpeaking ? "bg-violet-500/15" : "bg-violet-500/8"
        )} />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/8 rounded-full blur-[100px]" />

        {/* Subtle noise texture */}
        <div
          className="absolute inset-0 opacity-[0.012]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Header - Premium Glass Style */}
      <header className="flex-shrink-0 flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 relative z-10">
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Avatar with custom favicon */}
          <img
            src="/favicon.png"
            alt="Lisa"
            className={cn(
              "w-11 h-11 sm:w-12 sm:h-12 rounded-xl object-cover transition-all duration-300",
              isListening && "ring-2 ring-emerald-500/50",
              isSpeaking && "ring-2 ring-violet-500/50"
            )}
          />

          {/* Name + Status */}
          <div>
            <h1 className="text-white font-semibold text-base sm:text-lg tracking-tight">Lisa</h1>

            <motion.div
              layout
              className={cn(
                "flex items-center gap-1.5 text-xs font-medium transition-colors duration-300",
                status.color === 'emerald' && "text-emerald-400",
                status.color === 'violet' && "text-violet-400",
                status.color === 'amber' && "text-amber-400",
                status.color === 'slate' && "text-gray-500"
              )}
            >
              {status.icon && (
                <status.icon className={cn("w-3.5 h-3.5", status.spin && "animate-spin")} />
              )}
              <span>{status.label}</span>

              {/* Animated dots when listening/speaking */}
              {(isListening || isSpeaking) && (
                <span className="flex gap-0.5 ml-1">
                  <span className="w-1 h-1 rounded-full bg-current" style={{ animation: 'bounce 0.6s infinite 0ms' }} />
                  <span className="w-1 h-1 rounded-full bg-current" style={{ animation: 'bounce 0.6s infinite 150ms' }} />
                  <span className="w-1 h-1 rounded-full bg-current" style={{ animation: 'bounce 0.6s infinite 300ms' }} />
                </span>
              )}
            </motion.div>
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2">
          {/* Home button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { if (isInCall) endCall(); navigate('/'); }}
            className="p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/[0.10] backdrop-blur-sm transition-all"
            title="Home"
          >
            <Home className="w-5 h-5 text-gray-400 hover:text-white transition-colors" />
          </motion.button>


          {/* Settings button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { if (isInCall) endCall(); navigate('/settings'); }}
            className="p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/[0.10] backdrop-blur-sm transition-all"
            title="Settings"
          >
            <Settings className="w-5 h-5 text-gray-400 hover:text-white transition-colors" />
          </motion.button>

          {/* Live badge */}
          <AnimatePresence>
            {isInCall && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs text-emerald-400 font-medium">Live</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative z-10 px-4 sm:px-6 py-3 sm:py-4 overflow-hidden">

        {/* Transcript Area */}
        <div className="flex-1 max-w-3xl mx-auto w-full overflow-y-auto py-4 space-y-3 scroll-hide">
          {!isInCall && transcriptLines.length === 0 ? (
            /* Empty State - Premium */
            <div className="h-full flex flex-col items-center justify-center text-center px-6">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="relative mb-8"
              >
                <img src="/favicon.png" alt="Lisa" className="w-24 h-24 rounded-2xl object-cover opacity-60" />
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.5 }}
                className="text-2xl font-semibold text-white mb-3 font-['Space_Grotesk',sans-serif]"
              >
                Start a conversation
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45, duration: 0.5 }}
                className="text-gray-500 text-sm max-w-xs leading-relaxed"
              >
                Tap the microphone below and speak naturally. Lisa will respond.
              </motion.p>
            </div>
          ) : (
            <>
              <AnimatePresence initial={false} mode="popLayout">
                {transcriptLines.map((line, idx) => (
                  <motion.div
                    key={`${idx}-${line.time}`}
                    layout
                    initial={{ opacity: 0, y: 12, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                    className={cn("flex", line.role === 'user' ? "justify-end" : "justify-start")}
                  >
                    <div className={cn(
                      "max-w-[85%] sm:max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed",
                      line.role === 'user'
                        ? "bg-gradient-to-br from-cyan-500/12 to-blue-500/12 text-cyan-100 border border-cyan-500/15 rounded-br-md"
                        : "bg-gradient-to-br from-violet-500/12 to-fuchsia-500/12 text-violet-100 border border-violet-500/15 rounded-bl-md"
                    )}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[11px] font-medium uppercase tracking-wider opacity-60">
                          {line.role === 'user' ? 'You' : 'Lisa'}
                        </span>
                        <span className="text-[11px] opacity-40">{line.time}</span>
                      </div>
                      <p className="text-[15px]">{line.text}</p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Interim text (user speaking) */}
              <AnimatePresence>
                {interimText && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="flex justify-end"
                  >
                    <div className="max-w-[85%] sm:max-width-[75%] px-4 py-3 rounded-2xl bg-cyan-500/8 border border-cyan-500/12 text-cyan-300/80 rounded-br-md text-sm">
                      {interimText}
                      <span className="inline-block w-1.5 h-4 bg-cyan-400 ml-1.5 animate-pulse rounded-full" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Current spoken text (Lisa speaking) */}
              <AnimatePresence>
                {currentSpokenText && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="flex justify-start"
                  >
                    <div className="max-w-[85%] sm:max-w-[75%] px-4 py-3 rounded-2xl bg-violet-500/8 border border-violet-500/12 text-violet-300/80 rounded-bl-md text-sm">
                      {currentSpokenText}
                      <span className="inline-block w-1.5 h-4 bg-violet-400 ml-1.5 animate-pulse rounded-full" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Scroll anchor — always scrolled into view on new content */}
              <div ref={transcriptEndRef} />
            </>
          )}
        </div>

        {/* Error Display */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 12, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -12, height: 0 }}
              className="max-w-3xl mx-auto w-full mb-4 overflow-hidden"
            >
              <div className="p-3.5 rounded-xl bg-red-500/8 border border-red-500/15 flex items-center gap-3 text-red-400 text-sm backdrop-blur-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1">{error}</span>
                <button
                  onClick={() => setError(null)}
                  className="p-1 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Controls Area – perfectly centred mic */}
        <div className="flex-shrink-0 pb-6 sm:pb-8 pt-4">
          <div className="max-w-3xl mx-auto grid grid-cols-[1fr_auto_1fr] items-center gap-4">

            {/* Left column: End call button (visible only when in call) */}
            <div className="flex justify-start">
              <AnimatePresence>
                {isInCall && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={endCall}
                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 flex items-center justify-center shadow-lg shadow-red-500/30 transition-all"
                    title="End call"
                  >
                    <PhoneOff className="w-6 h-6 text-white" />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            {/* Centre column: Microphone button */}
            <motion.button
              whileHover={!isProcessing && !isSpeaking ? { scale: 1.04 } : {}}
              whileTap={{ scale: 0.92 }}
              onClick={handleMicPress}
              disabled={isProcessing || isSpeaking}
              className={cn(
                "relative w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center transition-all duration-300 ease-out",
                isListening
                  ? "bg-gradient-to-r from-emerald-400 to-green-500 shadow-2xl shadow-emerald-500/40 scale-105"
                  : "bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 shadow-xl shadow-violet-500/30 hover:shadow-violet-500/40 hover:scale-[1.02]",
                (isProcessing || isSpeaking) && "opacity-75 cursor-not-allowed"
              )}
              title={isListening ? "Tap to stop" : isInCall ? "Tap to speak" : "Start conversation"}
            >
              {/* pulse rings (keep exactly as they were) */}
              {(isListening || isSpeaking) && (
                <>
                  <motion.div
                    className="absolute inset-0 rounded-full bg-current"
                    style={{ color: isListening ? 'rgb(16, 185, 129)' : 'rgb(139, 92, 246)' }}
                    animate={{ scale: [1, 1.6], opacity: [0.4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
                  />
                  <motion.div
                    className="absolute inset-0 rounded-full bg-current"
                    style={{ color: isListening ? 'rgb(16, 185, 129)' : 'rgb(139, 92, 246)' }}
                    animate={{ scale: [1, 1.4], opacity: [0.3, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut", delay: 0.3 }}
                  />
                </>
              )}

              {isListening ? (
                <Mic className="w-8 h-8 sm:w-10 sm:h-10 text-white relative z-10" />
              ) : (
                <MicOff className="w-8 h-8 sm:w-10 sm:h-10 text-white/90 relative z-10" />
              )}
            </motion.button>

            {/* Right column: empty – balances the left column to keep mic exactly centred */}
            <div />
          </div>

          {/* Instruction text */}
          <motion.p
            key={isInCall ? 'in-call' : 'idle'}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mt-5 text-gray-500 text-xs sm:text-sm font-medium"
          >
            {isInCall
              ? isListening
                ? "Listening... tap to stop"
                : isProcessing
                  ? "Thinking..."
                  : isSpeaking
                    ? "Speaking..."
                    : "Tap microphone to speak"
              : "Tap microphone to begin"
            }
          </motion.p>
        </div>
      </main>
    </div>
  );
}
