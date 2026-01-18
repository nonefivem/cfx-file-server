await Bun.build({
  entrypoints: ["src/index.ts"],
  outdir: "dist",
  naming: "server.js",
  target: "node",
  format: "cjs",
  minify: {
    whitespace: true,
    syntax: true,
    identifiers: false,
    keepNames: false
  },
  sourcemap: false
});

console.log("✅ Build completed!");
