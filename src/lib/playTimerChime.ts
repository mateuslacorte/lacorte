const CHIME_SRC = '/sounds/timer-chime.mp3';

let chime: HTMLAudioElement | null = null;

/** Play the shared timer/pomodoro completion chime (best-effort). */
export function playTimerChime(): void {
  if (typeof window === 'undefined') return;

  try {
    if (!chime) {
      chime = new Audio(CHIME_SRC);
    }
    chime.currentTime = 0;
    void chime.play().catch(() => {
      /* autoplay may be blocked until a user gesture; timers start after one */
    });

    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200]);
    }
  } catch {
    /* audio unsupported */
  }
}
