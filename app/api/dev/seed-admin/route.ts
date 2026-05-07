import { pool } from "@/lib/db";
import { hashPassword } from "@/lib/hash";

export async function POST(req: Request) {
  try {
    const { password } = await req.json();

    if (!password) {
      return Response.json(
        { error: "Senha obrigatória" },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(password);

    // ADMIN
    const admin = await pool.query(
      `
      INSERT INTO users (name, email, password_hash, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id, email, role
      `,
      ["Admin", "admin@gmail.com", hashedPassword, "admin"]
    );

    // VENDOR
    const vendor = await pool.query(
      `
      INSERT INTO users (name, email, password_hash, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id, email, role
      `,
      ["Vendor", "vendor@gmail.com", hashedPassword, "vendor"]
    );

    return Response.json({
      ok: true,
      admin: admin.rows[0],
      vendor: vendor.rows[0],
    });
  } catch (err: any) {
    return Response.json(
      { error: err.message },
      { status: 500 }
    );
  }
}