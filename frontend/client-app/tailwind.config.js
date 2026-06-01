/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
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
          50: '#f3f8f1',
          100: '#dbe9d5',
          500: '#2F6B3B',
          600: '#285b33',
          700: '#214d2b',
          900: '#173820',
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
        loreto: '0 20px 45px rgba(39, 65, 38, 0.18)',
      },
    },
  },
  plugins: [],
};
