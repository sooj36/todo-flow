import { spawnSync } from "node:child_process";

const args = process.argv.slice(2);
const cleanedArgs = args[0] === "--" ? args.slice(1) : args;

const result = spawnSync("vitest", ["run", ...cleanedArgs], {
  stdio: "inherit",
});

process.exit(result.status ?? 1);
