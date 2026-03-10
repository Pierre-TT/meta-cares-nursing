import { useCallback, useEffect, useRef, useState } from 'react';

// Extend Window for the webkit-prefixed variant (Chrome/Safari < 25)
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

export interface UseVoiceRecognitionReturn {
  /** Whether the browser supports the Web Speech API */
  isSupported: boolean;
  /** Whether the microphone is actively recording */
  isRecording: boolean;
  /** Accumulated final transcript from the current session */
  transcript: string;
  /** Live partial result while the user is still speaking */
  interimTranscript: string;
  /** Start a new recording session */
  start: () => void;
  /** Stop the current recording session (keeps transcript) */
  stop: () => void;
  /** Stop and clear transcript */
  reset: () => void;
}

/**
 * Wraps the Web Speech API in a React hook.
 *
 * - Uses continuous + interimResults mode for real-time feedback.
 * - Auto-restarts on Chrome's forced 60 s timeout while `isRecording` is true.
 * - Supports `fr-BE` (Belgian French) by default.
 * - Gracefully handles browsers that lack the API.
 */
export function useVoiceRecognition(lang = 'fr-BE'): UseVoiceRecognitionReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  // We track intended recording state in a ref so the `onend` handler can
  // decide whether to auto-restart without stale closures.
  const intendedRecordingRef = useRef(false);

  const isSupported =
    typeof window !== 'undefined' &&
    (typeof window.SpeechRecognition !== 'undefined' ||
      typeof window.webkitSpeechRecognition !== 'undefined');

  /** Build and wire up a fresh SpeechRecognition instance. */
  const createRecognition = useCallback((): SpeechRecognition | null => {
    if (!isSupported) return null;

    const Ctor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    const recognition = new Ctor();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = lang;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalChunk = '';
      let interimChunk = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalChunk += result[0].transcript;
        } else {
          interimChunk += result[0].transcript;
        }
      }

      if (finalChunk) {
        setTranscript((prev) =>
          (prev ? `${prev} ${finalChunk.trim()}` : finalChunk.trim()).trim(),
        );
        setInterimTranscript('');
      } else {
        setInterimTranscript(interimChunk);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      // 'no-speech' is a non-fatal timeout — Chrome fires this often.
      if (event.error === 'no-speech') return;
      // Any other error stops the session.
      intendedRecordingRef.current = false;
      setIsRecording(false);
      setInterimTranscript('');
    };

    recognition.onend = () => {
      setInterimTranscript('');
      // Chrome auto-stops after ~60 s. If we still intend to record, restart.
      if (intendedRecordingRef.current && recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch {
          // Already started — ignore.
        }
      }
    };

    return recognition;
  }, [isSupported, lang]);

  const start = useCallback(() => {
    if (!isSupported || intendedRecordingRef.current) return;

    const recognition = createRecognition();
    if (!recognition) return;

    recognitionRef.current = recognition;
    intendedRecordingRef.current = true;

    try {
      recognition.start();
      setIsRecording(true);
    } catch {
      intendedRecordingRef.current = false;
      setIsRecording(false);
    }
  }, [isSupported, createRecognition]);

  const stop = useCallback(() => {
    intendedRecordingRef.current = false;
    setIsRecording(false);
    setInterimTranscript('');

    if (recognitionRef.current) {
      // Remove onend to prevent auto-restart after we intentionally stop.
      recognitionRef.current.onend = null;
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore if already stopped.
      }
      recognitionRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    stop();
    setTranscript('');
    setInterimTranscript('');
  }, [stop]);

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      intendedRecordingRef.current = false;
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        try {
          recognitionRef.current.abort();
        } catch {
          // Ignore.
        }
        recognitionRef.current = null;
      }
    };
  }, []);

  return { isSupported, isRecording, transcript, interimTranscript, start, stop, reset };
}
