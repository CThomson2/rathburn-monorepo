// Polyfill crypto for Next.js build process
if (typeof global.crypto === "undefined") {
  try {
    const nodeCrypto = require("crypto");
    global.crypto = {
      getRandomValues: function (buffer) {
        return nodeCrypto.randomFillSync(buffer);
      },
    };

    if (nodeCrypto.webcrypto && nodeCrypto.webcrypto.subtle) {
      global.crypto.subtle = nodeCrypto.webcrypto.subtle;
    }

    console.log("✅ Injected crypto polyfill into global context");
  } catch (error) {
    console.warn("Failed to polyfill crypto:", error);
  }
}

// Export the module to avoid errors
module.exports = {};
