import fs from "node:fs";
const dir = "qa-artifacts/lighthouse";
const rows = [];
let failed = false;
for (const file of fs.readdirSync(dir).filter(f => f.endsWith(".json"))) {
  const report = JSON.parse(fs.readFileSync(dir + "/" + file, "utf8"));
  const scores = Object.fromEntries(Object.entries(report.categories).map(([key, value]) => [key, Math.round(value.score * 100)]));
  rows.push({ page: file.replace(".json", ""), ...scores });
  if (Object.values(scores).some(score => score < 95)) failed = true;
}
console.table(rows);
fs.writeFileSync("qa-artifacts/lighthouse-summary.json", JSON.stringify(rows, null, 2));
if (failed) process.exit(1);
