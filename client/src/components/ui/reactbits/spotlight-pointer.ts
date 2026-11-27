let installed = false;

/**
 * Registers one delegated pointer listener that feeds the `--mx` / `--my` CSS
 * variables used by every `.spotlight-card` (React Bits "SpotlightCard" effect).
 * A single listener keeps the cost flat no matter how many cards are on screen.
 */
export function installSpotlightPointer(): void {
  if (installed || typeof document === 'undefined') return;
  installed = true;

  document.addEventListener(
    'pointermove',
    (event) => {
      const target = event.target as HTMLElement | null;
      const card = target?.closest?.('.spotlight-card') as HTMLElement | null;
      if (!card) return;
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${event.clientX - rect.left}px`);
      card.style.setProperty('--my', `${event.clientY - rect.top}px`);
    },
    { passive: true }
  );
}
