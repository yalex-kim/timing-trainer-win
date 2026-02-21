import { useCallback, useEffect, useRef } from 'react';

/**
 * Audio Beep Hook
 * Provides a reusable beep sound functionality for training sessions
 *
 * @returns {Object} Object containing the playBeep function
 */
export function useAudioBeep() {
  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize AudioContext
  useEffect(() => {
    // Ensure we're on the client side
    if (typeof window === 'undefined') return;

    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
        latencyHint: 'interactive',
      });
    }

    return () => {
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, []);

  /**
   * Resume AudioContext if it's suspended (required by modern browsers)
   */
  const initAudio = useCallback(async () => {
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }
  }, []);

  /**
   * Play a beep sound at 1200Hz
   */
  const playBeep = useCallback(() => {
    if (!audioContextRef.current) return;

    const audioContext = audioContextRef.current;
    
    // Resume context if needed
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 1200;
    oscillator.type = 'sine';

    const startTime = audioContext.currentTime;
    const duration = 0.1;

    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.005); // Rapid fade-in to reduce clicking
    gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

    oscillator.start(startTime);
    oscillator.stop(startTime + duration);
  }, []);

  return { playBeep, initAudio };
}
