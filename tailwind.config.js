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
                "surface-light": "#ffffff",
                "surface-dark": "#1a2c2e",
                "spa-teal": "#4c9a93",
                "spa-cream": "#fffcf5",
                "teal-dark": "#0d1a1b",
                "teal-muted": "#4c939a",
                "text-main": "#0f172a",
                "text-muted": "#64748b",
                "sidebar-active-bg": "#e6f9fb",
                "sidebar-active-text": "#0d9488",
            },
            fontFamily: {
                "display": ["Plus Jakarta Sans", "sans-serif"]
            },
            borderRadius: {
                "DEFAULT": "0.5rem",
                "lg": "1rem",
                "xl": "1.5rem",
                "2xl": "2rem",
                "full": "9999px"
            },
            boxShadow: {
                "soft": "0 4px 20px -2px rgba(19, 218, 236, 0.1), 0 0 0 1px rgba(19, 218, 236, 0.05)",
                "card": "0 2px 10px rgba(0, 0, 0, 0.03)"
            },
        },
    },
    plugins: [
        require("@tailwindcss/forms"),
        require("@tailwindcss/container-queries")
    ],
};
