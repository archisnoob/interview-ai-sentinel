
import { useState, useEffect, useRef } from 'react';
import { TypingEvent } from '@/services/api';

// This hook calculates Words Per Minute (WPM) based on typing events.
// It provides a "live" WPM that reflects the user's current typing speed
// by calculating it over recent "bursts" of typing, rather than the entire session.
export const useWpm = (typingEvents: TypingEvent[], isActive: boolean) => {
  const [wpm, setWpm] = useState(0);
  // Use a ref to access the latest typingEvents inside setInterval without re-triggering the effect on every keystroke.
  const eventsRef = useRef(typingEvents);
  eventsRef.current = typingEvents;

  useEffect(() => {
    if (!isActive) {
      setWpm(0);
      return;
    }

    // The interval updates the WPM every second.
    // It's set up only once when the session becomes active and cleared when it becomes inactive.
    const intervalId = setInterval(() => {
      const currentEvents = eventsRef.current;
      
      // If there are no events, WPM is 0.
      if (currentEvents.length === 0) {
        setWpm(0);
        return;
      }
      
      // Filter for character-producing keydown events.
      const charKeydownEvents = currentEvents.filter(e => 
        e.type === 'keydown' && 
        e.key !== 'Backspace' && 
        e.key.length === 1
      );
      
      if (charKeydownEvents.length === 0) {
        setWpm(0);
        return;
      }

      // If the last character was typed more than 2 seconds ago, reset WPM to 0.
      // This handles the "reset on no typing" requirement.
      const lastEventTimestamp = charKeydownEvents[charKeydownEvents.length - 1].timestamp;
      if (Date.now() - lastEventTimestamp > 2000) {
        setWpm(0);
        return;
      }
      
      // To calculate live WPM, we consider a "typing burst" to be a series of
      // keystrokes with no pause longer than 2 seconds between them.
      let burstStartIndex = 0;
      for (let i = charKeydownEvents.length - 1; i > 0; i--) {
        const pause = charKeydownEvents[i].timestamp - charKeydownEvents[i-1].timestamp;
        if (pause > 2000) { // A pause over 2 seconds defines the start of a new burst.
            burstStartIndex = i;
            break;
        }
      }
      
      const burstEvents = charKeydownEvents.slice(burstStartIndex);
      const firstEventInBurstTime = burstEvents[0]?.timestamp;

      if (!firstEventInBurstTime) {
        setWpm(0);
        return;
      }

      // Calculate elapsed time from the start of the current burst.
      const elapsedMinutes = (Date.now() - firstEventInBurstTime) / 1000 / 60;

      if (elapsedMinutes > 0) {
        // WPM formula: (character count / 5) / elapsed minutes
        const grossWpm = (burstEvents.length / 5) / elapsedMinutes;
        setWpm(grossWpm);
      } else {
        setWpm(0);
      }
    }, 1000); // Update WPM every second.

    return () => clearInterval(intervalId);
  }, [isActive]); // This effect only depends on `isActive`.

  return wpm;
};
