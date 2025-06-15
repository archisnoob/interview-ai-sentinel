
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { startMonitoring } from './utils/ai-usage-detector.js';
import { startAIOverlayDetection } from './utils/ai-overlay-detector.js';

// Start AI usage monitoring
startMonitoring();

// Start AI overlay detection
startAIOverlayDetection();

createRoot(document.getElementById("root")!).render(<App />);
