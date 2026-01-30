/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/main/resources/ui/**/*.html",
        "./src/main/resources/ui/assets/js/**/*.js"
    ],
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                "primary": "#13daec",
                "background-light": "#f6f8f8",
                "background-dark": "#102220",
                "spa-teal": "#4c9a93",
                "spa-cream": "#fffcf5",
                "teal-dark": "#0d1a1b",
                "teal-muted": "#4c939a",
            },
            fontFamily: {
                "display": ["Plus Jakarta Sans", "sans-serif"]
            },
            borderRadius: {
                "DEFAULT": "0.5rem",
                "lg": "1rem",
                "xl": "1.5rem",
                "full": "9999px"
            },
        },
    },
    plugins: [
        require("@tailwindcss/forms"),
        require("@tailwindcss/container-queries")
    ],
};
