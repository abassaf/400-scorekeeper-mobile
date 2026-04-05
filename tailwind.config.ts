import type { Config } from 'tailwindcss';

export default {
  content: ['./App.{ts,tsx}', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {},
  },
} satisfies Config;
