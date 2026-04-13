import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    screens: {
      xs:  '375px',
      sm:  '640px',
      md:  '768px',
      lg:  '1024px',
      xl:  '1280px',
      '2xl': '1536px'
    },
    extend: {
      colors: {
        brand: {
          950: '#081b29',
          800: '#0f3d5c',
          600: '#15639e'
        }
      },
      width: {
        resume: '794px'
      },
      height: {
        resume: '1123px'
      },
      maxWidth: {
        resume: '794px'
      }
    }
  },
  plugins: []
};

export default config;
