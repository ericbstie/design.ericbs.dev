#!/usr/bin/env bun
import { rm, rename } from "fs/promises";
import path from "path";


const pkgDir = import.meta.dir;
const repoRoot = path.resolve(pkgDir, "../..");
const outdir = path.join(pkgDir, "dist");

await rm(outdir, { recursive: true, force: true });


console.log("📦 Bundling JS + CSS…");

const result = await Bun.build({
  entrypoints: [path.join(repoRoot, "src/lib.ts")],
  outdir,
  target: "browser",
  format: "esm",
  sourcemap: "linked",
  external: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "react-dom/client"],
  define: { "process.env.NODE_ENV": JSON.stringify("production") },
});

if (!result.success) {
  console.error(result.logs.join("\n"));
  process.exit(1);
}

const renames = result.outputs
  .map(o => o.path)
  .filter(p => path.basename(p).startsWith("lib."))
  .map(p => rename(p, path.join(path.dirname(p), path.basename(p).replace(/^lib\./, "index."))));
await Promise.all(renames);

await fixSourcemapRef(path.join(outdir, "index.js"));

async function fixSourcemapRef(file: string) {
  const src = await Bun.file(file).text();

  await Bun.write(file, src.replace("sourceMappingURL=lib.js.map", "sourceMappingURL=index.js.map"));
}


console.log("🏷️  Emitting type declarations…");

const tsc = Bun.spawnSync(["bunx", "tsc", "-p", path.join(pkgDir, "tsconfig.json")], { cwd: pkgDir, stdout: "inherit", stderr: "inherit" });

if (tsc.exitCode !== 0) process.exit(tsc.exitCode);

await rename(path.join(outdir, "lib.d.ts"), path.join(outdir, "index.d.ts"));

// The bundled CSS ships as dist/index.css, so the per-module side-effect
// imports emitted by tsc would point at files that don't exist in dist.
for (const f of new Bun.Glob("**/*.d.ts").scanSync(outdir)) {
  await stripCssImports(path.join(outdir, f));
}

async function stripCssImports(file: string) {
  const src = await Bun.file(file).text();

  await Bun.write(file, src.replace(/^import "\.\/[^"]+\.css";\n/gm, ""));
}


await Bun.write(path.join(outdir, "styles.d.css.ts"), "export {};\n");

const files = [...new Bun.Glob("**/*").scanSync(outdir)].sort();

console.log("\n✅ dist/\n" + files.map(f => "   " + f).join("\n"));
