
import { useState, useEffect } from 'react';
import { TypingEvent } from '@/services/api';
import { CandidateProfile } from '@/services/profiles';

export const useTypingStats = (
  typingEvents: TypingEvent[], 
  profile: CandidateProfile, 
  onSuspiciousActivity: (activity: string) => void,
  isActive: boolean
) => {
  const [stats, setStats] = useState({
    totalKeystrokes: 0,
    backspaces: 0,
    pasteEvents: 0,
    idlePauses: 0
  });
  const [keystrokeData, setKeystrokeData] = useState<{ time: number; value: number }[]>([]);
  const [backspaceData, setBackspaceData] = useState<{ time: number; value: number }[]>([]);

  useEffect(() => {
    const keydownEvents = typingEvents.filter(e => e.type === 'keydown');
    const backspaceEvents = keydownEvents.filter(e => e.key === 'Backspace');
    const pasteEvents = typingEvents.filter(e => e.type === 'paste');
    
    // Calculate idle pauses (gaps > suspiciousIdlePause threshold)
    let idlePauses = 0;
    for (let i = 1; i < typingEvents.length; i++) {
      const timeDiff = typingEvents[i].timestamp - typingEvents[i-1].timestamp;
      if (timeDiff > profile.thresholds.suspiciousIdlePause * 1000) {
        idlePauses++;
      }
    }

    setStats({
      totalKeystrokes: keydownEvents.length,
      backspaces: backspaceEvents.length,
      pasteEvents: pasteEvents.length,
      idlePauses
    });

    // Check for suspicious patterns
    if (idlePauses > profile.thresholds.maxSuspiciousIdlePauses) {
      onSuspiciousActivity(`Excessive idle pauses detected: ${idlePauses}`);
    }

    // Check for paste events exceeding threshold
    const largePastes = pasteEvents.filter(e => (e.textLength || 0) > profile.thresholds.largePasteChars);
    if (largePastes.length > 0) {
      largePastes.forEach(paste => {
        onSuspiciousActivity(`Large paste detected: ${paste.textLength} characters`);
      });
    }

    // Generate data for sparklines
    if (isActive) {
      if (keydownEvents.length > 1) {
        const startTime = keydownEvents[0].timestamp;
        const data = keydownEvents.map((e, index) => ({
          time: (e.timestamp - startTime) / 1000,
          value: index + 1,
        }));
        if (data.length > 50) {
          const step = Math.floor(data.length / 50);
          setKeystrokeData(data.filter((_, i) => i % step === 0));
        } else {
          setKeystrokeData(data);
        }
      } else {
        setKeystrokeData([]);
      }

      if (backspaceEvents.length > 1) {
        const startTime = backspaceEvents[0].timestamp;
        const data = backspaceEvents.map((e, index) => ({
          time: (e.timestamp - startTime) / 1000,
          value: index + 1,
        }));
        if (data.length > 50) {
          const step = Math.floor(data.length / 50);
          setBackspaceData(data.filter((_, i) => i % step === 0));
        } else {
          setBackspaceData(data);
        }
      } else {
        setBackspaceData([]);
      }
    } else {
      setKeystrokeData([]);
      setBackspaceData([]);
    }

  }, [typingEvents, profile, onSuspiciousActivity, isActive]);

  return { stats, keystrokeData, backspaceData };
};
