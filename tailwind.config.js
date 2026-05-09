/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // App backgrounds
        'app-bg':       '#F2EFE9',
        'surface':      '#FFFFFF',
        'surface-2':    '#F0EDE7',
        'surface-3':    '#E8E4DE',

        // Onboarding
        'brand-dark':   '#1B3D2F',
        'brand-yellow': '#F5C518',

        // Semantic
        'green-mid':    '#2D7D46',
        'green-bg':     '#E3F5E9',
        'amber-mid':    '#D4880A',
        'amber-bg':     '#FEF3DC',
        'red-mid':      '#C0392B',
        'red-bg':       '#FDECEA',
        'blue-mid':     '#1A5FB4',
        'blue-bg':      '#E4EEFF',
        'purple-mid':   '#5B3FA6',
        'purple-bg':    '#EEEAFF',

        // Text
        'tx':           '#1A1916',
        'tx-2':         '#6B6860',
        'tx-3':         '#A8A59E',
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        serif: ['DM Serif Display', 'serif'],
        mono: ['DM Mono', 'monospace'],
      },
      borderRadius: {
        'card': '14px',
        'pill': '999px',
      },
    },
  },
  plugins: [],
}
