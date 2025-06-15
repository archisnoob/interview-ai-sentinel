
// Known AI tool selectors and patterns
export const AI_SELECTORS = [
  // ChatGPT and OpenAI
  '[class*="chatgpt"]', '[id*="chatgpt"]', '[data-testid*="chat"]',
  // Claude/Anthropic
  '[class*="claude"]', '[id*="claude"]', '[class*="anthropic"]',
  // Cursor AI
  '[class*="cursor"]', '[id*="cursor-ai"]', '[data-cursor]',
  // Parakit AI
  '[class*="parakit"]', '[id*="parakit"]', '[data-parakit]',
  // GitHub Copilot
  '[class*="copilot"]', '[id*="copilot"]', '[data-copilot]',
  // Generic AI patterns
  '[class*="ai-assist"]', '[class*="ai-chat"]', '[class*="assistant"]',
  '[class*="gpt"]', '[id*="ai-"]', '[data-ai]',
  // ADDED: Gemini and PoE
  '[class*="gemini"]', '[id*="gemini"]', '[class*="poe-"]', '[id*="poe-"]',
  // Floating widgets
  '[style*="position: fixed"]', '[style*="z-index: 9999"]'
];

// AI-related text patterns
export const AI_TEXT_PATTERNS = [
  /ask me anything/i,
  /how can I help/i,
  /ai assistant/i,
  /powered by (gpt|claude|openai)/i,
  /chat with ai/i,
  /copilot/i,
  /parakit/i
];
