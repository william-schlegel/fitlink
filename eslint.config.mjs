import next from "eslint-config-next";

// Flat-config for ESLint v9+. Using Next's official flat config avoids
// legacy/config-compat validation that was causing a circular JSON issue
// (plugins.react -> configs.flat -> plugins ...). Do not attach plugin
// objects manually here.

const config = [
  // Next.js base + Core Web Vitals rules, TypeScript/React aware
  ...next,

  // Project-specific tweaks can go here
  {
    name: "project-overrides",
    ignores: [
      "convex/_generated/**",
      "drizzle/meta/**",
      "node_modules/**",
      ".next/**",
      "out/**",
    ],
    rules: {
      // Example: customize as you like
      // "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  },
];

export default config;
