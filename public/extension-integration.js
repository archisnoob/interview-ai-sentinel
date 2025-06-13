
// Chrome Extension Integration Script
// This file demonstrates the expected extension behavior
// Include this in your Chrome extension's content script

window.addEventListener("message", (event) => {
  // Only respond to messages from the same origin for security
  if (event.origin !== window.location.origin) {
    return;
  }

  // Handle handshake request
  if (event.data?.type === "AI_EXTENSION_HANDSHAKE") {
    console.log("Extension: Received handshake request");
    window.postMessage({ type: "AI_EXTENSION_ACK" }, "*");
  }

  // Handle ping request
  if (event.data?.type === "AI_EXTENSION_PING") {
    console.log("Extension: Received ping request");
    window.postMessage({ type: "AI_EXTENSION_PONG" }, "*");
  }
});

console.log("AI Interview Detection Extension Integration Script Loaded");
