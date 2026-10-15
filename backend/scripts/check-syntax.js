const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory() && entry.name !== "node_modules") walk(full);
    else if (entry.isFile() && entry.name.endsWith(".js") && !full.endsWith("check-syntax.js")) {
      const result = spawnSync(process.execPath, ["--check", full], { encoding: "utf8" });
      if (result.status !== 0) {
        console.error(`Syntax error in ${full}\n${result.stderr}`);
        process.exitCode = 1;
      }
    }
  }
}
walk(path.join(__dirname, ".."));
if (!process.exitCode) console.log("Backend JavaScript syntax checks passed.");
