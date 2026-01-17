const isDev = process.argv.includes("--dev");

await Bun.build({
  entrypoints: ["src/index.ts"],
  outdir: "dist",
  naming: "server.js",
  target: "node",
  minify: !isDev,
  sourcemap: isDev ? "inline" : "none",
  external: ["@citizenfx/http-wrapper"],
  define: {
    "process.env.NODE_ENV": isDev ? '"development"' : '"production"',
  },
});

console.log(`✅ Build complete (${isDev ? "development" : "production"})`);
