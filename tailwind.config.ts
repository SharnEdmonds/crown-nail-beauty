import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                "marble-stone": "#E8E4E0",
                "clean-white": "#FAFAFA",
                "crown-black": "#1A1A1A",
                "charcoal-grey": "#4A4A4A",
                "stone-grey": "#8A8A8A",
                "warm-black": "#2C2C2C",
                "soft-rose": "#D4B5B0",
                "brushed-gold": "#C9A962",
            },
            fontFamily: {
                serif: ["var(--font-serif)", "serif"],
                sans: ["var(--font-sans)", "sans-serif"],
            },
            backgroundImage: {
                "marble-pattern": "url('/images/marble-bg.jpg')", // Placeholder if needed
            },
            padding: {
                safe: "env(safe-area-inset-top)",
            },
        },
    },
    plugins: [],
};
export default config;
