/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./**/*.html",
        "./**/*.js"
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
            colors: {
                ipace: {
                    blue: '#2cc3f3',
                    pink: '#ee3a7b',
                    orange: '#faa82e',
                    green: '#9ccc51',
                    white: '#ffffff',
                    text: '#4b5563',
                    title: '#374151',
                },
            },
        },
    },
    plugins: [],
};
