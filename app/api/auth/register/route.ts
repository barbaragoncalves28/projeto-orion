import { hashPassword } from "@/lib/hash";
import { pool } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { name, email, password, role = "customer" } = await req.json();

    const hashedPassword = await hashPassword(password);

    const result = await pool.query(
      `
      INSERT INTO users (name, email, password_hash, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, email, role
      `,
      [name, email, hashedPassword, role]
    );

    return Response.json(result.rows[0]);
  } catch (error: any) {
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}