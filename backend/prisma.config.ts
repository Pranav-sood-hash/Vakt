import "dotenv/config";
import { defineConfig } from "prisma/config";
import path from "path";
import { fileURLToPath } from "url";

// Get the directory of the current file (backend root)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const databaseUrl = process.env.DATABASE_URL || "file:./prisma/dev.db";

export default defineConfig({
  // Use absolute path for the schema so it works from any directory
  schema: path.join(__dirname, "prisma/schema.prisma"),
  datasource: {
    url: databaseUrl,
  },
});
