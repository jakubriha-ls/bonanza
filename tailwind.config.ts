import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "fs-red": "#FF0046",
        "fs-slate": "#001E28",
        "fs-slate-light": "#0F2D37",
        "fs-slate-dark": "#00141E",
        "fs-white": "#FFFFFF",
        "fs-chalk": "#EEEEEE",
        "fs-gray-1": "#C8CDCD",
        "fs-gray-2": "#999999",
        "fs-gray-3": "#555E61",
      },
      fontFamily: {
        flash: ['"Flash Display"', "sans-serif"],
        fs: ['"FS Numbers"', "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
