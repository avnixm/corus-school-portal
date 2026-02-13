import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

// Ensure DATABASE_URL is loaded for drizzle-kit (uses .env.local in this project)
config({ path: ".env.local" });

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
