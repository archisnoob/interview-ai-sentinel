
// Safe development URLs that should be ignored
const devSafeSites = [
  'localhost',
  '127.0.0.1',
  'lovable.dev',
  'lovable.app',
  'interview-ai-sentinel.lovable.app',
  'openai.com',
  'claude.ai',
  'copilot.github.com'
];

// Function to check if current site is a safe development environment
export const isDevSafeEnvironment = () => {
  if (typeof window === 'undefined') return false;
  const currentURL = window.location.hostname;
  return devSafeSites.some(site => currentURL.includes(site));
};
