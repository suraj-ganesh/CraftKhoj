import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./drizzle/schema.ts",
  out: "./drizzle/migrations",
  dbCredentials: {
    url: "postgresql://postgres.bgvzjnhwpqonhluhyrmo:CraftKhoj%40%23%24101@db.bgvzjnhwpqonhluhyrmo.supabase.co:5432/postgres",
  },
});
