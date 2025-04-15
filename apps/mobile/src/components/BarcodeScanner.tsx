
import { useRef, useEffect, useState } from 'react';

interface BarcodeScannerProps {
  onScan: (data: string) => void;
}

const BarcodeScanner = ({ onScan }: BarcodeScannerProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isActive, setIsActive] = useState(true);
  const [lastScanTime, setLastScanTime] = useState(0);
  const bufferTimeout = useRef<number | null>(null);
  
  // Function to handle barcode input
  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.trim();
    
    // Clear any existing timeout
    if (bufferTimeout.current) {
      window.clearTimeout(bufferTimeout.current);
      bufferTimeout.current = null;
    }
    
    // Only process if we have a value
    if (value) {
      // Debounce to avoid double scans - many scanners will trigger multiple events
      // Set a timeout to process the scan after a short delay
      bufferTimeout.current = window.setTimeout(() => {
        const now = Date.now();
        
        // Prevent duplicate scans within 500ms
        if (now - lastScanTime > 500) {
          setLastScanTime(now);
          onScan(value);
        }
        
        // Clear the input for next scan
        if (inputRef.current) {
          inputRef.current.value = '';
        }
      }, 50);
    }
  };

  // Handle special key combinations keyboard wedge scanners might send
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Many scanners will send Enter key after the scan
    if (e.key === 'Enter') {
      const value = inputRef.current?.value.trim() || '';
      
      if (value) {
        const now = Date.now();
        
        // Prevent duplicate scans within 500ms
        if (now - lastScanTime > 500) {
          setLastScanTime(now);
          onScan(value);
        }
        
        // Clear the input for next scan
        if (inputRef.current) {
          inputRef.current.value = '';
        }
        
        // Prevent default to avoid form submissions
        e.preventDefault();
      }
    }
  };

  // Keep input in focus at all times
  useEffect(() => {
    // Focus input on mount
    if (inputRef.current) {
      inputRef.current.focus();
    }
    
    // Set up interval to re-focus input
    const focusInterval = setInterval(() => {
      if (document.activeElement !== inputRef.current) {
        inputRef.current?.focus();
        setIsActive(document.activeElement === inputRef.current);
      } else {
        setIsActive(true);
      }
    }, 300);
    
    // Ensure focus on user interaction
    const handleInteraction = () => {
      inputRef.current?.focus();
      setIsActive(document.activeElement === inputRef.current);
    };
    
    // Register various events to ensure we maintain focus
    document.addEventListener('touchstart', handleInteraction);
    document.addEventListener('click', handleInteraction);
    window.addEventListener('focus', handleInteraction);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        setTimeout(handleInteraction, 100);
      }
    });
    
    // iOS requires special handling - the keyboard can't be hidden completely
    const preventZoom = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };
    
    document.addEventListener('touchmove', preventZoom, { passive: false });
    
    // Cleanup all event listeners on unmount
    return () => {
      clearInterval(focusInterval);
      if (bufferTimeout.current) {
        window.clearTimeout(bufferTimeout.current);
      }
      document.removeEventListener('touchstart', handleInteraction);
      document.removeEventListener('click', handleInteraction);
      window.removeEventListener('focus', handleInteraction);
      document.removeEventListener('visibilitychange', () => {});
      document.removeEventListener('touchmove', preventZoom);
    };
  }, []);

  // Function to manually focus the input (for manual mode)
  const focusInput = () => {
    inputRef.current?.focus();
    setIsActive(true);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full relative">
      {/* Hidden input to capture barcode scans */}
      <input
        ref={inputRef}
        type="text"
        className="opacity-0 absolute h-px w-px -z-10 top-0 left-0 pointer-events-none"
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        autoComplete="off"
        autoFocus
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck="false"
        aria-label="Barcode scan input"
      />
      
      {/* Scan indicator */}
      <div 
        className="text-center w-full cursor-pointer"
        onClick={focusInput}
      >
        <div className={`mx-auto rounded-full w-32 h-32 flex items-center justify-center ${isActive ? 'bg-blue-100 border-blue-500' : 'bg-gray-100 border-gray-300'} mb-6 border-4 transition-colors ${isActive ? 'animate-pulse' : ''}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-16 w-16 ${isActive ? 'text-blue-700' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Ready to Scan</h2>
        <p className="text-gray-600 max-w-xs mx-auto">
          {isActive 
            ? "Simply scan any barcode with your wedge scanner." 
            : "Tap here to activate scanner. Scanner is inactive."
          }
        </p>
      </div>
      
      {/* Status indicator - always visible */}
      <div className="absolute bottom-4 left-0 right-0 mx-auto text-center">
        <div className={`inline-flex items-center px-3 py-1 rounded-full ${isActive ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
          <span className={`w-2 h-2 rounded-full mr-2 ${isActive ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`}></span>
          {isActive ? 'Scanner Active' : 'Scanner Inactive - Tap to Activate'}
        </div>
      </div>
    </div>
  );
};

export default BarcodeScanner;
