import { useEffect, useRef } from 'react';
import { sound } from '../services/sound';

interface UseBarcodeScannerProps {
  onScan: (barcode: string) => void;
  enabled?: boolean;
  minChars?: number;
  maxIntervalMs?: number;
  playSound?: boolean;
}

export function useBarcodeScanner({
  onScan,
  enabled = true,
  minChars = 3,
  maxIntervalMs = 45,
  playSound = true
}: UseBarcodeScannerProps) {
  const bufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore modifier keys
      if (e.key === 'Shift' || e.key === 'Control' || e.key === 'Alt' || e.key === 'Meta') {
        return;
      }

      const now = Date.now();
      const timeDiff = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      // Handle Enter (Scanner suffix)
      if (e.key === 'Enter') {
        if (bufferRef.current.length >= minChars) {
          e.preventDefault();
          e.stopPropagation();
          const scannedCode = bufferRef.current.trim();
          bufferRef.current = '';
          
          if (playSound) sound.playScanSuccess();
          onScan(scannedCode);
        } else {
          bufferRef.current = '';
        }
        return;
      }

      // If key is a printable character (length 1)
      if (e.key.length === 1) {
        const target = e.target as HTMLElement | null;
        const isInputFocused =
          target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

        // If target is an input, only buffer if speed indicates scanner burst (< 45ms)
        // Or if buffer is already building from scanner
        if (isInputFocused && timeDiff > maxIntervalMs && bufferRef.current.length === 0) {
          // Normal manual human typing inside an input field
          return;
        }

        // If time between keystrokes is too large, reset buffer (it was human typing, not scanner)
        if (timeDiff > maxIntervalMs && bufferRef.current.length > 0) {
          bufferRef.current = '';
        }

        bufferRef.current += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [enabled, minChars, maxIntervalMs, playSound, onScan]);

  // Helper function to simulate scanning programmatically
  const simulateScan = (barcode: string) => {
    if (playSound) sound.playScanSuccess();
    onScan(barcode);
  };

  return { simulateScan };
}
