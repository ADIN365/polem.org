import type { Config } from "tailwindcss";

/**
 * 끝장토론 Tailwind 설정.
 * 색·폰트·크기는 모두 globals.css 의 CSS Variables 와 매핑.
 * 디자인 토큰 변경 시 globals.css 한 곳만 수정.
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx,js,jsx}",
    "./components/**/*.{ts,tsx,js,jsx}",
    "./lib/**/*.{ts,tsx,js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        page: "var(--bg-page)",
        card: "var(--bg-card)",
        soft: "var(--bg-soft)",
        dark: "var(--bg-dark)",
        deep: "var(--bg-deep)",
        ink: {
          DEFAULT: "var(--ink)",
          2: "var(--ink-2)",
          3: "var(--ink-3)",
          4: "var(--ink-4)",
          soft: "var(--ink-soft)",
        },
        paper: {
          cream: "var(--paper-cream)",
          "cream-dim": "var(--paper-cream-dim)",
        },
        border: {
          DEFAULT: "var(--border)",
          soft: "var(--border-soft)",
        },
        accent: {
          warm: "var(--accent-warm)",
          "warm-light": "var(--accent-warm-light)",
          warn: "var(--accent-warn)",
        },
      },
      fontFamily: {
        sans: ["var(--sans)"],
        serif: ["var(--serif)"],
        mono: ["var(--mono)"],
      },
      fontSize: {
        base: "var(--fs-base)",
        small: "var(--fs-small)",
        tiny: "var(--fs-tiny)",
        meta: "var(--fs-meta)",
        pin: "var(--fs-pin)",
        button: "var(--fs-button)",
        "button-large": "var(--fs-button-large)",
        eyebrow: "var(--fs-eyebrow)",
        "eyebrow-tight": "var(--fs-eyebrow-tight)",
        input: "var(--fs-input)",
        question: "var(--fs-question)",
        "title-h1": "var(--fs-title-h1)",
        "title-h2": "var(--fs-title-h2)",
        "title-h3": "var(--fs-title-h3)",
        "title-h4": "var(--fs-title-h4)",
        "title-modal": "var(--fs-title-modal)",
        "stat-num": "var(--fs-stat-num)",
        brand: "var(--fs-brand)",
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
      },
      transitionTimingFunction: {
        ink: "cubic-bezier(0.2, 0.6, 0.2, 1)",
      },
      maxWidth: {
        site: "1180px",
        narrow: "780px",
      },
    },
  },
  plugins: [],
};

export default config;
