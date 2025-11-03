/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,js}"
  ],
  safelist: [
    'bg-blue-500',
    'bg-green-500',
    'bg-amber-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-cyan-500',
    'bg-red-500',
    'bg-indigo-500',
    'bg-teal-500',
    'bg-orange-500',
    'bg-lime-500',
    'bg-violet-500',
    'bg-gray-500',
    'text-white'
  ],
  theme: {
    fontFamily: {
      'montserrat': ['Montserrat', 'sans-serif'],
      'berkshire': ['Berkshire', 'sans-serif'],
    },
    extend: {
      animation: {
        fadeIn: 'fadeIn 2s ease-in-out',
      },
      keyframes: {
        fadeIn:{
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        }
      }
    },
  },
  plugins: [
    require('daisyui'),
  ],
  daisyui: {
    themes: [
      "light",
      "dark",
      "cupcake",
      "bumblebee",
      "emerald",
      "corporate",
      "synthwave",
      "retro",
      "cyberpunk",
      "valentine",
      "halloween",
      "garden",
      "forest",
      "aqua",
      "lofi",
      "pastel",
      "fantasy",
      "wireframe",
      "black",
      "luxury",
      "dracula",
      "cmyk",
      "autumn",
      "business",
      "acid",
      "lemonade",
      "night",
      "coffee",
      "winter",
      "dim",
      "nord",
      "sunset",
    ],
    base: true,
    styled: true,
    utils: true,
    prefix: "",
    logs: true,
    themeRoot: ":root",
  },
}

