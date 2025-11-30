const fs = require('fs');
const path = require('path');
const postcss = require('postcss');
const { compile } = require('tailwindcss');

function collectFiles(targetPath, bucket = []) {
  if (!fs.existsSync(targetPath)) return bucket;
  const stats = fs.statSync(targetPath);
  if (stats.isDirectory()) {
    for (const entry of fs.readdirSync(targetPath)) {
      if (entry === 'node_modules' || entry.startsWith('.')) continue;
      collectFiles(path.join(targetPath, entry), bucket);
    }
  } else {
    bucket.push(targetPath);
  }
  return bucket;
}

function extractCandidates(text) {
  const candidates = new Set();
  const pattern = /(?:[A-Za-z0-9_-]+\[[^\]]+\])|[A-Za-z0-9_:\-./%]+/g;
  const matches = text.match(pattern) || [];
  for (const token of matches) {
    if (token.length < 2) continue;
    if (!/[A-Za-z]/.test(token)) continue;
    if (token.includes('class') || token.includes('http')) continue;
    candidates.add(token);
  }
  return candidates;
}

module.exports = () => {
  return {
    postcssPlugin: 'tailwindcss-lite',
    async Once(root, { result }) {
      const cssInput = root.toString();
      const compiled = await compile(cssInput, { from: result.opts.from });

      const projectRoot = __dirname;
      const targets = [path.join(projectRoot, 'index.html'), path.join(projectRoot, 'src')];
      const candidates = new Set();
      for (const target of targets) {
        const files = collectFiles(target);
        for (const file of files) {
          try {
            const content = fs.readFileSync(file, 'utf8');
            extractCandidates(content).forEach((token) => candidates.add(token));
          } catch (error) {
            // eslint-disable-next-line no-console
            console.warn(`tailwindcss-lite: unable to read ${file}:`, error.message);
          }
        }
      }

      const outputCss = compiled.build(Array.from(candidates));
      const parsed = postcss.parse(outputCss, { from: result.opts.from });
      root.removeAll();
      root.append(parsed.nodes);
    },
  };
};

module.exports.postcss = true;
