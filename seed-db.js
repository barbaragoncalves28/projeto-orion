const { Pool } = require("pg");

const pool = new Pool({
  connectionString: "postgresql://postgres:28062001@localhost:5432/orion",
});

async function main() {
  try {
    const restaurant = await pool.query(`
      INSERT INTO restaurants (name)
      VALUES ('Restaurante Teste')
      RETURNING id, name
    `);

    const restaurantId = restaurant.rows[0].id;

    console.log("Restaurant criado:", restaurant.rows[0]);

    const product = await pool.query(
      `
      INSERT INTO products (name, price, restaurant_id)
      VALUES ($1, $2, $3)
      RETURNING id, name, restaurant_id
      `,
      ["Hamburguer Teste", 25.9, restaurantId]
    );

    console.log("Produto criado:", product.rows[0]);
  } catch (error) {
    console.error(error);
  } finally {
    await pool.end();
  }
}

main();