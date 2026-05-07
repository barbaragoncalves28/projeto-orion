const { Pool } = require("pg");

const pool = new Pool({
  connectionString: "postgresql://postgres:28062001@localhost:5432/orion",
});

async function main() {
  try {
    const restaurants = await pool.query(
      "SELECT id, name FROM restaurants LIMIT 10"
    );
    console.log("RESTAURANTS:");
    console.table(restaurants.rows);

    const products = await pool.query(
      "SELECT id, name, restaurant_id FROM products LIMIT 10"
    );
    console.log("PRODUCTS:");
    console.table(products.rows);
  } catch (error) {
    console.error(error);
  } finally {
    await pool.end();
  }
}

main();