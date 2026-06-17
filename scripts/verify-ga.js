const fs = require("node:fs");
const path = require("node:path");

const trackingId = "G-3BS81LHVJ0";
const htmlPath = path.join(process.cwd(), "out", "index.html");

if (!fs.existsSync(htmlPath)) {
  throw new Error("Missing out/index.html. Run npm run build before publishing.");
}

const html = fs.readFileSync(htmlPath, "utf8");
const requiredSnippets = [
  `https://www.googletagmanager.com/gtag/js?id=${trackingId}`,
  `gtag('config', '${trackingId}')`
];

const missing = requiredSnippets.filter((snippet) => !html.includes(snippet));

if (missing.length > 0) {
  throw new Error(`Google Analytics tag is missing from out/index.html: ${missing.join(", ")}`);
}

console.log(`Verified Google Analytics tag ${trackingId} in out/index.html`);
