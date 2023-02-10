module.exports = {
  theme: {
    screens: {
      'sm': '640px',
      // => @media (min-width: 640px) { ... }

      'md': '768px',
      // => @media (min-width: 768px) { ... }

      'lg': '900px',
      // => @media (min-width: 1024px) { ... }

      'xl': '1300px',
      // => @media (min-width: 1280px) { ... }

      '2xl': '1536px',
      // => @media (min-width: 1536px) { ... }
    }
  },
  daisyui: {
    themes: [
      {
        mytheme: {



          "primary": "#006daa",



          "secondary": "#daaf2f",



          "accent": "#1d4ed8",



          "neutral": "#14110F",



          "base-100": "#14110F",



          "info": "#3ABFF8",



          "success": "#91e949",



          "warning": "#8e3df2",



          "error": "#ff5964",
        },
      },
    ],
  },
  content: ['./public/index.html', './src/**/*.svelte'],
  plugins: [require('daisyui')],
};
