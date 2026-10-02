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
        "tl-blue": "#0077c8",
        "tl-navy": "#163247",
        "tl-light": "#f5f9fc",
      },
    },
  },
  plugins: [],
};
export default config;
