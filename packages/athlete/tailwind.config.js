/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ['./src/**/*.{js,jsx,ts,tsx}', './index.{js,jsx,ts,tsx}'],
    presets: [require('nativewind/preset')],
    theme: {
        extend: {
            colors: {
                surface: '#000000',
                'surface-secondary': '#1C1C1E',
                'surface-tertiary': '#2C2C2E',
                label: '#FFFFFF',
                'label-secondary': '#8E8E93',
                'label-tertiary': '#636366',
                'accent-blue': '#0A84FF',
                'accent-red': '#FF453A',
            },
        },
    },
    plugins: [],
}
