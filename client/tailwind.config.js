/**
 * DAMA identity palette
 * ---------------------------------------------------------------------------
 * Concept: "Deep sea & saffron". The immutable DAMA logo is a deep navy, so the
 * UI is built around it instead of the default electric blue:
 *   - blue   -> Lagoon (petrol cyan). Remaps every existing `blue-*` utility so
 *               the whole app moves away from the generic royal blue at once.
 *   - indigo -> Ink (logo navy). Former blue->indigo gradients become lagoon->navy.
 *   - accent -> Saffron. Warm highlight for active states, glows and details.
 * Semantic colors (emerald success, amber warning, rose danger) are untouched.
 *
 * @type {import('tailwindcss').Config}
 */
const lagoon = {
  50: '#EAF6F9',
  100: '#D0ECF2',
  200: '#A3D9E5',
  300: '#6BC0D3',
  400: '#36A2BC',
  500: '#1485A1',
  600: '#0A6E87', // Primary CTA (white text contrast ~5.4:1)
  700: '#0A586D',
  800: '#0B4659',
  900: '#0B3949',
  950: '#06232E',
};

const ink = {
  50: '#EEF2F7',
  100: '#DCE4EE',
  200: '#BCC9DC',
  300: '#94A7C3',
  400: '#6A82A6',
  500: '#4A6590',
  600: '#36507A',
  700: '#2A3F63',
  800: '#1F3150',
  900: '#14223D',
  950: '#0A1730',
};

const saffron = {
  50: '#FFF8E8',
  100: '#FEEFC6',
  200: '#FDE08F',
  300: '#FACB57',
  400: '#F6B535',
  500: '#E39A14',
  600: '#C27C0C',
  700: '#9A5F0E',
  800: '#7A4B12',
  900: '#653F12',
};

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: lagoon,
        blue: lagoon,
        indigo: ink,
        ink,
        accent: saffron,
      },
      fontFamily: {
        sans: ['"Instrument Sans"', 'Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['"Bricolage Grotesque"', '"Instrument Sans"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
