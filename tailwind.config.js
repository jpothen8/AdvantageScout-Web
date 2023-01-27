module.exports = {
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
