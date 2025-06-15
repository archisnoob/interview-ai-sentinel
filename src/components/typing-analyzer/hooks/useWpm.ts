
import { useState, useEffect } from 'react';
import { TypingEvent } from '@/services/api';

export const useWpm = (typingEvents: TypingEvent[], isActive: boolean) => {
  const [wpm, setWpm] = useState(0);

  useEffect(() => {
    if (!isActive) {
      setWpm(0);
      return;
    }

    const intervalId = setInterval(() => {
      const firstEventTime = typingEvents[0]?.timestamp;
      if (!firstEventTime) {
        setWpm(0);
        return;
      }
      
      // Filter for character keys, excluding backspace and other non-printing keys
      const charKeydownEvents = typingEvents.filter(e => 
        e.type === 'keydown' && 
        e.key !== 'Backspace' && 
        e.key.length === 1
      );
      
      const elapsedMinutes = (Date.now() - firstEventTime) / 1000 / 60;

      if (elapsedMinutes > 0) {
        const grossWpm = (charKeydownEvents.length / 5) / elapsedMinutes;
        setWpm(grossWpm);
      } else {
        setWpm(0);
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [isActive, typingEvents]);

  return wpm;
};
