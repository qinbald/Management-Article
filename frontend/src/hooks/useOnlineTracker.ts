'use client';

import { useEffect, useRef } from 'react';

export function useOnlineTracker() {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const sendPing = async () => {
      if (document.visibilityState === 'visible') {
        let visitorId = localStorage.getItem('visitor_id');
        if (!visitorId) {
          visitorId = crypto.randomUUID();
          localStorage.setItem('visitor_id', visitorId);
        }

        try {
          await fetch('/api/flask/api/analytics/ping', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ visitor_id: visitorId })
          });
        } catch (e) {
          // Abaikan error ping
        }
      }
    };

    // Ping pertama kali saat mount
    sendPing();

    // Ping tiap 30 detik
    intervalRef.current = setInterval(sendPing, 30000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);
}