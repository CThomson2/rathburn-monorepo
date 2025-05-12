// utils/deviceDetection.ts
/**
 * Utility function to detect if the current device is a mobile device
 * based on the user agent string.
 * 
 * @returns {boolean} True if the device is a mobile device, false otherwise
 */
export const isMobile = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

/**
 * Utility function to detect if the current device is iOS
 * 
 * @returns {boolean} True if the device is an iOS device, false otherwise
 */
export const isIOS = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  
  // Check for iOS devices - explicit check for Windows devices using MSStream property
  const userAgent = navigator.userAgent;
  const isIOSDevice = /iPhone|iPad|iPod/i.test(userAgent);
  const isMSStream = Boolean((window as any).MSStream);
  
  // iOS devices that aren't on Windows
  return isIOSDevice && !isMSStream;
};

/**
 * Utility function to detect if the current device is Android
 * 
 * @returns {boolean} True if the device is an Android device, false otherwise
 */
export const isAndroid = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  
  return /Android/i.test(navigator.userAgent);
};