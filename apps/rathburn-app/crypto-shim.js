
// This shim is loaded before Next.js to ensure crypto is available globally
if (typeof globalThis.crypto === 'undefined') {
  const crypto = require('crypto');
  
  // Define crypto polyfill for Node.js
  globalThis.crypto = {
    getRandomValues: function(buffer) {
      return crypto.randomFillSync(buffer);
    }
  };
  
  // Add webcrypto.subtle if available
  if (crypto.webcrypto && crypto.webcrypto.subtle) {
    globalThis.crypto.subtle = crypto.webcrypto.subtle;
  }
  
  console.log('✅ Injected crypto polyfill into global context');
}
