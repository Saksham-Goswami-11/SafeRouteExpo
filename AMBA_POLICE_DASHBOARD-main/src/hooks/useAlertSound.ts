import { useCallback, useRef } from 'react';

// Generate a synthetic alert beep using the Web Audio API (no external files needed)
export function useAlertSound() {
    const audioCtxRef = useRef<AudioContext | null>(null);

    const playAlertSound = useCallback(() => {
        try {
            if (!audioCtxRef.current) {
                audioCtxRef.current = new AudioContext();
            }
            const ctx = audioCtxRef.current;

            // Play 3 short beeps
            for (let i = 0; i < 3; i++) {
                const oscillator = ctx.createOscillator();
                const gain = ctx.createGain();

                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
                gain.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.25);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.25 + 0.2);

                oscillator.connect(gain);
                gain.connect(ctx.destination);

                oscillator.start(ctx.currentTime + i * 0.25);
                oscillator.stop(ctx.currentTime + i * 0.25 + 0.2);
            }
        } catch (e) {
            console.warn('Could not play alert sound:', e);
        }
    }, []);

    return { playAlertSound };
}
