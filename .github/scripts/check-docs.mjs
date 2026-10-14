// No network or dependencies: validate local Markdown/HTML links in tracked and
// not-yet-staged documentation. External URLs are deliberately not fetched.
import { execFileSync } from "node:child_process";
import { readFileSync, existsSync, statSync } from "node:fs";
import path from "node:path";
const root = process.cwd();
const files = [
  ...new Set(
    execFileSync(
      "git",
      ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
      { encoding: "utf8" },
    )
      .split("\0")
      .filter((name) => name.endsWith(".md")),
  ),
];
const errors = [];
let checked = 0;
for (const file of files) {
  if (!existsSync(file)) continue;
  const source = readFileSync(file, "utf8").replace(/```[^]*?```/g, "");
  const targets = [
    ...[...source.matchAll(/!?\[[^\]\n]*\]\(([^\s)]+)(?:\s+"[^"]*")?\)/g)].map(
      (m) => m[1],
    ),
    ...[...source.matchAll(/(?:href|src)=["']([^"']+)["']/g)].map((m) => m[1]),
  ];
  for (const target of targets) {
    if (/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(target)) continue;
    const [filename, anchor] = target.split("#");
    const clean = decodeURIComponent(filename.split("?")[0]);
    const resolved = clean
      ? path.resolve(path.dirname(file), clean)
      : path.resolve(file);
    if (!resolved.startsWith(root + path.sep) || !existsSync(resolved)) {
      errors.push(`${file}: missing or out-of-repository target ${target}`);
      continue;
    }
    if (anchor && resolved.endsWith(".md") && statSync(resolved).isFile()) {
      const content = readFileSync(resolved, "utf8").replace(
        /```[^]*?```/g,
        "",
      );
      const slugs = new Set();
      const counts = new Map();
      for (const heading of content.matchAll(/^#{1,6}\s+(.+)$/gm)) {
        const base = heading[1]
          .replace(/<[^>]+>/g, "")
          .trim()
          .toLowerCase()
          .replace(/[^\p{L}\p{N}_\-\s]/gu, "")
          .replace(/\s/g, "-");
        const count = counts.get(base) || 0;
        slugs.add(count ? `${base}-${count}` : base);
        counts.set(base, count + 1);
      }
      if (!slugs.has(decodeURIComponent(anchor)))
        errors.push(`${file}: missing Markdown heading ${target}`);
    }
    checked++;
  }
  for (const image of source.matchAll(/<img\b[^>]*>/g)) {
    if (!/\balt=["'][^"']+["']/.test(image[0]))
      errors.push(`${file}: HTML image needs meaningful alt text`);
  }
}
if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else
  console.log(
    `PASS: ${checked} local links across ${files.length} Markdown files. External URLs were not checked.`,
  );
