import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { startMonitoring } from './utils/ai-usage-detector.js';

startMonitoring();
createRoot(document.getElementById("root")!).render(<App />);
