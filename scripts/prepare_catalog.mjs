import { copyFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
const root = new URL("../", import.meta.url);
copyFileSync(fileURLToPath(new URL("data/programs/schema-v1.json", root)),
  fileURLToPath(new URL("web/public/catalog/schema-v1.json", root)));
