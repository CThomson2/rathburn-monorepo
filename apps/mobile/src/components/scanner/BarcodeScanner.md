```
// components/BarcodeScanner.tsx
import { useState, useRef, useEffect } from 'react';

// Utility to detect mobile
const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

const BarcodeScanner = () => {
  const [isActive, setIsActive] = useState(false);
  const [lastScan, setLastScan] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Handle scanning
  const handleScan = (barcode: string) => {
    if (barcode && barcode.trim() !== '') {
      setLastScan(barcode);
      console.log('Scanned:', barcode);
      // Add your processing logic here
    }
  };

  // Activate scanning
  const activateScanner = () => {
    setIsActive(true);

    if (inputRef.current) {
      // For Android, set readonly first to prevent keyboard
      if (isMobile()) {
        inputRef.current.readOnly = true;
      }

      // Focus the input
      inputRef.current.focus();

      // For Android, remove readonly after focusing
      if (isMobile()) {
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.readOnly = false;
          }
        }, 100);
      }
    }
  };

  // Set up event listeners to keep input focused
  useEffect(() => {
    if (!isActive) return;

    const keepFocused = () => {
      if (inputRef.current && document.activeElement !== inputRef.current) {
        // For Android, prevent keyboard
        if (isMobile()) {
          inputRef.current.readOnly = true;
          inputRef.current.focus();
          setTimeout(() => {
            if (inputRef.current) inputRef.current.readOnly = false;
          }, 100);
        } else {
          inputRef.current.focus();
        }
      }
    };

    // Initial focus
    keepFocused();

    // Set up focus maintenance
    const focusInterval = setInterval(keepFocused, 500);
    document.addEventListener('visibilitychange', keepFocused);
    window.addEventListener('focus', keepFocused);

    return () => {
      clearInterval(focusInterval);
      document.removeEventListener('visibilitychange', keepFocused);
      window.removeEventListener('focus', keepFocused);
    };
  }, [isActive]);

  // Handle input change (barcode scan)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value) {
      handleScan(value);
      // Clear input for next scan
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  return (
    <div className="scanner-container">
      {/* Invisible input to capture scans */}
      <input
        ref={inputRef}
        type="text"
        onChange={handleInputChange}
        style={{
          position: 'absolute',
          opacity: 0,
          pointerEvents: 'none',
          height: 0,
          width: 0,
          padding: 0,
          border: 'none'
        }}
        autoComplete="off"
      />

      {/* Scanner UI */}
      <div className="scanner-ui no-select">
        <div className="scan-icon">
          {/* Your fingerprint/scan icon */}
        </div>
        <h2 className="no-select">Ready to Scan</h2>

        {/* Scan button that activates scanner without showing keyboard */}
        <button
          className="scan-button no-select"
          onClick={activateScanner}
          onTouchStart={activateScanner}
        >
          {isActive ? 'Scanner Active' : 'Activate Scanner'}
        </button>

        {lastScan && (
          <div className="last-scan">
            Last scan: {lastScan}
          </div>
        )}
      </div>
    </div>
  );
};

export default BarcodeScanner;
```
