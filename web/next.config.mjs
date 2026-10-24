import path from "node:path";
import { fileURLToPath } from "node:url";

// Pin the app root to web/ so the dev server neither scans the repo nor watches the agents' projects/ folder.
const root = path.dirname(fileURLToPath(import.meta.url));

export default { turbopack: { root } };
