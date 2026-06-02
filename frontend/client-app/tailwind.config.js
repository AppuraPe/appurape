const flowbite = require('flowbite/plugin');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}', './node_modules/flowbite/**/*.js'],
  theme: {
    extend: {
      colors: {
        loreto: {
          tacacho: '#B8833E',
          cecina: '#8A4B2A',
          chorizo: '#C8583D',
          chicha: '#D9A441',
          paiche: '#8FA7A6',
          verde: '#2F6B3B',
          rio: '#3C8FA8',
          hoja: '#7FAE58',
          crema: '#F2E4C8',
          carbon: '#3D2C22',
        },
        primary: {
          50: '#fff4ef',
          100: '#f8ddcf',
          500: '#C8583D',
          600: '#B04C34',
          700: '#8A4B2A',
          900: '#3D2C22',
        },
        accent: {
          500: '#B8833E',
          600: '#8A4B2A',
          700: '#C8583D',
        },
        surface: {
          base: '#F2E4C8',
          soft: '#fbf7ee',
          card: '#fffdf7',
        },
      },
      fontFamily: {
        display: ['"Baloo 2"', 'serif'],
        ui: ['Poppins', '"Segoe UI"', 'sans-serif'],
      },
      boxShadow: {
        loreto: '0 20px 45px rgba(138, 75, 42, 0.2)',
      },
    },
  },
  plugins: [flowbite],
};
