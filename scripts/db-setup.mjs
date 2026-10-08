import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import nextEnv from "@next/env";
import { neon } from "@neondatabase/serverless";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL is missing. Add it to .env.local and try again.");
  process.exit(1);
}

const sql = neon(databaseUrl);
const schema = await readFile(resolve("db/schema.sql"), "utf8");

for (const statement of schema.split(";").map((part) => part.trim()).filter(Boolean)) {
  await sql.query(statement);
}

const matchingRestaurants = await sql.query(
  "SELECT id FROM restaurants WHERE name = $1 AND cuisine = $2 AND area = $3 LIMIT 1",
  ["Ludhiana Burrito", "Indian", "Sector 32"],
);

let restaurantId = matchingRestaurants[0]?.id;
if (restaurantId === undefined) {
  const insertedRestaurants = await sql.query(
    "INSERT INTO restaurants (name, cuisine, area) VALUES ($1, $2, $3) RETURNING id",
    ["Ludhiana Burrito", "Indian", "Sector 32"],
  );
  restaurantId = insertedRestaurants[0].id;
}

const existingReviews = await sql.query(
  "SELECT id FROM reviews WHERE restaurant_id = $1 LIMIT 1",
  [restaurantId],
);

if (existingReviews.length === 0) {
  await sql.query(
    `INSERT INTO reviews (restaurant_id, rating, comment, created_at) VALUES
      ($1, 5, 'Paneer burrito is unreal', NOW() - INTERVAL '8 days'),
      ($1, 4, 'Good, but slow service', NOW() - INTERVAL '6 days'),
      ($1, 4, 'Solid. Would repeat.', NOW() - INTERVAL '2 days')`,
    [restaurantId],
  );
}

const rows = await sql.query(
  `SELECT r.id AS restaurant_id, r.name, r.cuisine, r.area,
          v.id AS review_id, v.rating, v.comment, v.created_at
   FROM restaurants AS r
   JOIN reviews AS v ON v.restaurant_id = r.id
   WHERE r.id = $1
   ORDER BY v.created_at ASC`,
  [restaurantId],
);

console.log("Restaurant and review rows:");
console.log(JSON.stringify(rows, null, 2));
