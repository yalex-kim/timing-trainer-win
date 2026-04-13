import { useCallback, useEffect } from 'react';

// Singleton instance to prevent multiple contexts and accidental closing
let globalAudioContext: AudioContext | null = null;

/**
 * Audio Beep Hook
 * Provides a reusable beep sound functionality for training sessions
 */
export function useAudioBeep() {
  // Function to get or create the context
  const getAudioContext = useCallback(() => {
    if (typeof window === 'undefined') return null;

    if (!globalAudioContext || globalAudioContext.state === 'closed') {
      globalAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        latencyHint: 'interactive',
      });
      console.log('New AudioContext created, state:', globalAudioContext.state);
    }
    return globalAudioContext;
  }, []);

  // Initialize on mount
  useEffect(() => {
    getAudioContext();
    // We do NOT close the context here anymore to keep it alive for the whole session
  }, [getAudioContext]);

  /**
   * Resume AudioContext if it's suspended
   */
  const initAudio = useCallback(async () => {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      await ctx.resume();
      console.log('AudioContext resumed via initAudio, state:', ctx.state);
    }
  }, [getAudioContext]);

  /**
   * Play a beep sound at 1200Hz
   */
  const playBeep = useCallback(() => {
    const audioContext = getAudioContext();
    if (!audioContext) return;
    
    // Resume context if suspended
    if (audioContext.state === 'suspended') {
      audioContext.resume().catch(console.error);
    }

    if (audioContext.state === 'closed') {
      console.warn('AudioContext is closed, sound will not play');
      return;
    }

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 1200;
    oscillator.type = 'sine';

    const startTime = audioContext.currentTime;
    const duration = 0.15;

    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(0.5, startTime + 0.01);
    gainNode.gain.linearRampToValueAtTime(0, startTime + duration);

    oscillator.start(startTime);
    oscillator.stop(startTime + duration);
  }, [getAudioContext]);

  return { playBeep, initAudio };
}
