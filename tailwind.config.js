/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#f5f5f5',
                    100: '#e5e5e5',
                    200: '#d4d4d4',
                    300: '#a3a3a3',
                    400: '#737373',
                    500: '#404040',
                    600: '#262626',
                    700: '#171717',
                    800: '#0a0a0a',
                    900: '#000000',
                    DEFAULT: '#000000',
                },
                secondary: {
                    50: '#fdf2f6',
                    100: '#fce7ef',
                    200: '#fad0e0',
                    300: '#f7aabf',
                    400: '#f27397',
                    500: '#FF2D7A', // Base Color
                    600: '#e61e66',
                    700: '#bf0d4d',
                    800: '#9f0e43',
                    900: '#85103b',
                    950: '#4a031e',
                    DEFAULT: '#FF2D7A',
                },
                // We can keep 'white' as standard tailwind white, or alias it if needed.
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'], // We can add a google font later
            },
        },
    },
    plugins: [],
}
